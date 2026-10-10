import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;
function getTransporter() {
  if (!env.emailConfigured) return null;
  if (!transporter) {
    const port = env.EMAIL_PORT ?? 587;
    transporter = nodemailer.createTransport({ host: env.EMAIL_HOST, port, secure: port === 465, auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD } });
  }
  return transporter;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const wrap = (title: string, body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0f172a"><h2 style="margin:0 0 16px">${esc(title)}</h2>${body}<p style="color:#64748b;font-size:12px;margin-top:32px">This is an automated message.</p></div>`;

/** Never throws: email failure must not break payment processing. */
export async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter();
  if (!t) { logger.info({ to, subject }, 'Email not configured; skipping send'); return; }
  try { await t.sendMail({ from: env.EMAIL_FROM || env.EMAIL_USER, to, subject, html }); }
  catch (e) { logger.warn({ err: (e as Error).message, subject }, 'Email send failed'); }
}

export const sendWelcomeEmail = (to: string, name: string) =>
  sendMail(to, 'Welcome!', wrap(`Welcome, ${name}`, `<p>Your account is ready. Browse our products and get instant access after payment.</p><p><a href="${env.primaryFrontend}/products">Explore products</a></p>`));

export const sendPaymentEmail = (to: string, d: { orderNumber: string; product: string; amount: number; productId: string }) =>
  sendMail(to, `Payment confirmed - ${d.orderNumber}`, wrap('Payment confirmed', `
    <table style="width:100%;border-collapse:collapse">
      <tr><td>Order number</td><td><b>${esc(d.orderNumber)}</b></td></tr>
      <tr><td>Product</td><td>${esc(d.product)}</td></tr>
      <tr><td>Amount</td><td>৳${d.amount.toFixed(2)}</td></tr>
      <tr><td>Payment status</td><td>PAID</td></tr></table>`));

export const sendAccessEmail = (to: string, d: { product: string; link: string }) =>
  sendMail(to, `Your access to ${d.product} is ready`, wrap('Your product is unlocked', `<p>You can now access <b>${esc(d.product)}</b> - no account needed.</p><p><a href="${d.link}">Open your product / download your file</a></p><p style="color:#64748b;font-size:12px">Keep this email. The link is private to you.</p>`));

export const sendResetEmail = (to: string, link: string) =>
  sendMail(to, 'Reset your password', wrap('Reset your password', `<p>Use the button below to choose a new password. The link works once and expires in 1 hour.</p><p><a href="${link}">Choose a new password</a></p><p style="color:#64748b;font-size:12px">If you did not ask for this, you can ignore this email.</p>`));

export const sendRecoveryEmail = (to: string, items: { title: string; orderNumber: string; link: string }[]) =>
  sendMail(to, 'Your purchase links', wrap('Your purchases', `<p>Here are the private links for your purchases:</p><ul>${items.map((i) => `<li><b>${esc(i.title)}</b> (${esc(i.orderNumber)}): <a href="${i.link}">open</a></li>`).join('')}</ul><p style="color:#64748b;font-size:12px">Keep these links private.</p>`));
