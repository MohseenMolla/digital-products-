export const formatBDT = (n: number) => `৳${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
export const formatDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const formatDateTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const TYPE_LABEL: Record<string, string> = {
  COURSE: 'Course', PDF: 'PDF', PREMIUM_APP: 'Premium App', DIGITAL_PRODUCT: 'Digital Product', SUBSCRIPTION: 'Subscription', OTHER: 'Other',
};
export const phonePattern = /^(?:\+?88)?01[3-9]\d{8}$/;
