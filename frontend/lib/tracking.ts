'use client'

import { hasConsent } from './consent'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    fbq?: (...args: unknown[]) => void
    ttq?: {
      track: (event: string, params?: Record<string, unknown>, options?: Record<string, unknown>) => void
    }
  }
}

interface TrackEventParams {
  value?: number
  currency?: string
  content_id?: string
  content_name?: string
  content_category?: string
  content_type?: string
  search_string?: string
  quantity?: number
  order_id?: string
  payment_method?: string
  [key: string]: unknown
}

const META_EVENT_MAP: Record<string, string> = {
  view_item: 'ViewContent',
  search: 'Search',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
}

const TIKTOK_EVENT_MAP: Record<string, string> = {
  view_item: 'ViewContent',
  search: 'Search',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'CompletePayment',
}

export function generateEventId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }
}

export function pushToDataLayer(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

export function trackEvent(eventName: string, params: TrackEventParams = {}): string {
  const eventId = (typeof params.event_id === 'string' && params.event_id) ? params.event_id : generateEventId()

  // Push to dataLayer (always)
  pushToDataLayer(eventName, { ...params, event_id: eventId })

  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq && hasConsent('marketing')) {
    const metaEvent = META_EVENT_MAP[eventName]
    const fbParams = { ...params, eventID: eventId }
    if (metaEvent) {
      window.fbq('track', metaEvent, fbParams, { eventID: eventId })
    } else {
      window.fbq('trackCustom', eventName, fbParams, { eventID: eventId })
    }
  }

  // TikTok Pixel
  if (typeof window !== 'undefined' && window.ttq && hasConsent('marketing')) {
    const ttEvent = TIKTOK_EVENT_MAP[eventName] || eventName
    window.ttq.track(ttEvent, { ...params }, { event_id: eventId })
  }

  return eventId
}

// --- Specific event helpers ---

export function trackPageView(): string {
  return trackEvent('page_view')
}

export function trackViewContent(product: {
  id: string
  name: string
  category?: string
  price: number
  currency?: string
}): string {
  return trackEvent('view_item', {
    content_id: product.id,
    content_name: product.name,
    content_category: product.category,
    content_type: 'product',
    value: product.price,
    currency: product.currency || 'BDT',
  })
}

export function trackSearch(query: string): string {
  return trackEvent('search', { search_string: query })
}

export function trackAddToCart(product: {
  id: string
  name: string
  price: number
  quantity?: number
  currency?: string
}): string {
  return trackEvent('add_to_cart', {
    content_id: product.id,
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: product.currency || 'BDT',
    quantity: product.quantity || 1,
  })
}

export function trackInitiateCheckout(product: {
  id: string
  name: string
  price: number
  currency?: string
}): string {
  return trackEvent('begin_checkout', {
    content_id: product.id,
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: product.currency || 'BDT',
  })
}

export function trackAddPaymentInfo(params: {
  orderNumber: string
  value: number
  paymentMethod: string
  currency?: string
}): string {
  return trackEvent('add_payment_info', {
    order_id: params.orderNumber,
    value: params.value,
    payment_method: params.paymentMethod,
    currency: params.currency || 'BDT',
  })
}

export function trackPurchase(params: {
  orderNumber: string
  value: number
  currency?: string
  productId: string
  productName: string
}): string {
  return trackEvent('purchase', {
    event_id: params.orderNumber,
    order_id: params.orderNumber,
    value: params.value,
    currency: params.currency || 'BDT',
    content_id: params.productId,
    content_name: params.productName,
    content_type: 'product',
  })
}

export function trackPaymentFailed(params: {
  orderNumber: string
  value: number
  reason?: string
}): string {
  return trackEvent('payment_failed', {
    order_id: params.orderNumber,
    value: params.value,
    failure_reason: params.reason,
  })
}

export function trackDownload(params: {
  productId: string
  productName: string
  fileType?: string
}): string {
  return trackEvent('download', {
    content_id: params.productId,
    content_name: params.productName,
    content_type: params.fileType || 'digital_product',
  })
}
