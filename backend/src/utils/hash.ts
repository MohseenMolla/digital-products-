import crypto from 'crypto';

export function sha256(val: string): string {
  return crypto.createHash('sha256').update((val || '').trim().toLowerCase()).digest('hex');
}

export function normalizeAndHashEmail(email: string): string {
  if (!email || !email.trim() || email.includes('@customer.neuromark.shop')) return '';
  return sha256(email);
}

export function normalizeAndHashPhone(phone: string): string {
  if (!phone || !phone.trim()) return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('0088')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = `88${digits}`;
  } else if (digits.length === 10 && digits.startsWith('1')) {
    digits = `880${digits}`;
  }

  return sha256(digits);
}
