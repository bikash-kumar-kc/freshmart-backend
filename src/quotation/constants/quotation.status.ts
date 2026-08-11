export const quotationStatus = [
  'approved',
  'request',
  'rejected',
  'rechecking',
  'delivered',
] as const;

export type QuotationStatus = (typeof quotationStatus)[number];
