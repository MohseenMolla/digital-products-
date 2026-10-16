import mongoose, { type HydratedDocument } from 'mongoose';
import { Order, type IOrder } from '../models/Order';
import { SiteSetting, type ISiteSetting } from '../models/SiteSetting';
import { normalizeAndHashEmail, normalizeAndHashPhone } from '../utils/hash';
import { logger } from '../utils/logger';

const sentTrackingOrders = new Set<string>();

interface TrackingCredentials {
  meta: { pixelId: string; accessToken: string };
  tiktok: { pixelId: string; accessToken: string };
  ga4: { gaId: string; apiSecret: string };
}

async function getTrackingCredentials(): Promise<TrackingCredentials> {
  let s: ISiteSetting | null = null;
  if (mongoose.connection.readyState === 1) {
    s = (await SiteSetting.findOne({ key: 'main' }).maxTimeMS(3000).lean().catch(() => null)) as ISiteSetting | null;
  }

  const metaPixelId = (s?.metaPixelId || process.env.META_PIXEL_ID || '').trim();
  const metaAccessToken = (s?.metaAccessToken || process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || '').trim();

  const tiktokPixelId = (s?.tiktokPixelId || process.env.TIKTOK_PIXEL_ID || '').trim();
  const tiktokAccessToken = (s?.tiktokAccessToken || process.env.TIKTOK_ACCESS_TOKEN || '').trim();

  const gaId = (s?.gaId || process.env.GA_MEASUREMENT_ID || process.env.GA4_ID || '').trim();
  const gaApiSecret = (s?.gaMeasurementSecret || process.env.GA_API_SECRET || process.env.GA4_API_SECRET || '').trim();

  return {
    meta: { pixelId: metaPixelId, accessToken: metaAccessToken },
    tiktok: { pixelId: tiktokPixelId, accessToken: tiktokAccessToken },
    ga4: { gaId, apiSecret: gaApiSecret },
  };
}

async function sendMetaPurchase(order: IOrder, creds: { pixelId: string; accessToken: string }): Promise<void> {
  if (!creds.pixelId || !creds.accessToken) {
    logger.debug({ orderNumber: order.orderNumber }, 'Meta CAPI skipped: credentials missing');
    return;
  }

  const attr = (order.attribution || {}) as Record<string, unknown>;
  const clientIp = typeof attr.clientIp === 'string' ? attr.clientIp : undefined;
  const userAgent = typeof attr.userAgent === 'string' ? attr.userAgent : undefined;
  const fbp = typeof attr.fbp === 'string' ? attr.fbp : undefined;
  const fbc = typeof attr.fbc === 'string' ? attr.fbc : undefined;

  const eventTime = Math.floor((order.paidAt ? new Date(order.paidAt).getTime() : Date.now()) / 1000);
  const hashedEmail = normalizeAndHashEmail(order.customerEmail);
  const hashedPhone = normalizeAndHashPhone(order.customerPhone);

  const body = {
    data: [
      {
        event_name: 'Purchase',
        event_time: eventTime,
        event_id: order.orderNumber,
        action_source: 'website',
        user_data: {
          em: hashedEmail ? [hashedEmail] : [],
          ph: hashedPhone ? [hashedPhone] : [],
          client_ip_address: clientIp,
          client_user_agent: userAgent,
          fbc,
          fbp,
        },
        custom_data: {
          value: order.amount,
          currency: order.currency || 'BDT',
          content_type: 'product',
          contents: [
            {
              id: String(order.product),
              quantity: 1,
              item_price: order.amount,
            },
          ],
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(creds.pixelId)}/events?access_token=${encodeURIComponent(creds.accessToken)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.warn({ status: res.status, errText, orderNumber: order.orderNumber }, 'Meta CAPI returned non-OK status');
    } else {
      logger.info({ orderNumber: order.orderNumber }, 'Meta CAPI Purchase event sent');
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message, orderNumber: order.orderNumber }, 'Meta CAPI request failed');
  }
}

async function sendTikTokPurchase(order: IOrder, creds: { pixelId: string; accessToken: string }): Promise<void> {
  if (!creds.pixelId || !creds.accessToken) {
    logger.debug({ orderNumber: order.orderNumber }, 'TikTok Events API skipped: credentials missing');
    return;
  }

  const attr = (order.attribution || {}) as Record<string, unknown>;
  const clientIp = typeof attr.clientIp === 'string' ? attr.clientIp : undefined;
  const userAgent = typeof attr.userAgent === 'string' ? attr.userAgent : undefined;
  const ttp = typeof attr.ttp === 'string' ? attr.ttp : undefined;

  const eventTime = Math.floor((order.paidAt ? new Date(order.paidAt).getTime() : Date.now()) / 1000);
  const hashedEmail = normalizeAndHashEmail(order.customerEmail);
  const hashedPhone = normalizeAndHashPhone(order.customerPhone);

  const body = {
    event_source: 'web',
    event_source_id: creds.pixelId,
    data: [
      {
        event: 'CompletePayment',
        event_id: order.orderNumber,
        event_time: eventTime,
        user: {
          email: hashedEmail || undefined,
          phone_number: hashedPhone || undefined,
          ip: clientIp,
          user_agent: userAgent,
          ttp,
        },
        properties: {
          value: order.amount,
          currency: order.currency || 'BDT',
          contents: [
            {
              id: String(order.product),
              content_id: String(order.product),
              content_type: 'product',
              content_name: order.productTitleSnapshot,
              quantity: 1,
              price: order.amount,
              item_price: order.amount,
            },
          ],
        },
      },
    ],
    ...(process.env.TIKTOK_TEST_EVENT_CODE ? { test_event_code: process.env.TIKTOK_TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': creds.accessToken,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.warn({ status: res.status, errText, orderNumber: order.orderNumber }, 'TikTok Events API returned non-OK status');
    } else {
      logger.info({ orderNumber: order.orderNumber }, 'TikTok CompletePayment event sent');
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message, orderNumber: order.orderNumber }, 'TikTok Events API request failed');
  }
}

async function sendGA4Purchase(order: IOrder, creds: { gaId: string; apiSecret: string }): Promise<void> {
  if (!creds.gaId || !creds.apiSecret) {
    logger.debug({ orderNumber: order.orderNumber }, 'GA4 Measurement Protocol skipped: credentials missing');
    return;
  }

  const attr = (order.attribution || {}) as Record<string, unknown>;
  const clientId =
    typeof attr.clientId === 'string' && attr.clientId
      ? attr.clientId
      : typeof attr.gaClientId === 'string' && attr.gaClientId
      ? attr.gaClientId
      : `${Date.now()}.${Math.floor(Math.random() * 1000000000)}`;

  const body = {
    client_id: clientId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: order.orderNumber,
          value: order.amount,
          currency: order.currency || 'BDT',
          items: [
            {
              item_id: String(order.product),
              item_name: order.productTitleSnapshot,
              price: order.amount,
              quantity: 1,
            },
          ],
        },
      },
    ],
  };

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(creds.gaId)}&api_secret=${encodeURIComponent(creds.apiSecret)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.warn({ status: res.status, errText, orderNumber: order.orderNumber }, 'GA4 Measurement Protocol returned non-OK status');
    } else {
      logger.info({ orderNumber: order.orderNumber }, 'GA4 purchase event sent');
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message, orderNumber: order.orderNumber }, 'GA4 Measurement Protocol request failed');
  }
}

export async function sendServerPurchaseTracking(order: HydratedDocument<IOrder> | IOrder): Promise<void> {
  if (!order || !order.orderNumber) return;

  // Deduplication check
  if (sentTrackingOrders.has(order.orderNumber) || (order.metadata as Record<string, unknown> | undefined)?.serverTrackingSent) {
    return;
  }
  sentTrackingOrders.add(order.orderNumber);
  if (sentTrackingOrders.size > 2000) {
    const first = sentTrackingOrders.values().next().value;
    if (first) sentTrackingOrders.delete(first);
  }

  const orderId = (order as { _id?: unknown })._id;
  if (orderId) {
    void Order.updateOne({ _id: orderId }, { $set: { 'metadata.serverTrackingSent': true } }).catch(() => {});
  }

  try {
    const creds = await getTrackingCredentials();
    await Promise.allSettled([
      sendMetaPurchase(order, creds.meta),
      sendTikTokPurchase(order, creds.tiktok),
      sendGA4Purchase(order, creds.ga4),
    ]);
  } catch (err) {
    logger.warn({ err: (err as Error).message, orderNumber: order.orderNumber }, 'Server-side tracking dispatch encountered an error');
  }
}
