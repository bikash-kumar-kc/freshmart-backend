// admin-quotations/quotation-status.utils.ts
import { sql } from 'drizzle-orm';
import { quotations } from '../db/schema';

export type QuotationStatus =
  | 'approved'
  | 'delivered'
  | 'pending'
  | 'cancelled'
  | 'rechecking'
  | 'countered';

export const APPROVED_BUCKET: QuotationStatus[] = ['approved', 'delivered'];
export const UNAPPROVED_BUCKET: QuotationStatus[] = [
  'pending',
  'cancelled',
  'rechecking',
  'countered',
];
export const OPEN_STATUSES: QuotationStatus[] = [
  'pending',
  'rechecking',
  'countered',
  'approved',
];

// One source of truth: CASE order is the precedence, so statuses can never overlap.
// 'draft' (created, never sent) isn't a status in the admin UI, so lists and detail exclude it.
export const quotationStatusSql = sql<string>`CASE
  WHEN ${quotations.isCancelledByAdmin} = 1 THEN 'cancelled'
  WHEN ${quotations.isDelivered} = 1 THEN 'delivered'
  WHEN ${quotations.isReapprovedByAdmin} = 1 THEN 'approved'
  WHEN ${quotations.isVendorUpdatedTheQuotation} = 1 THEN 'countered'
  WHEN ${quotations.isApprovedByVendor} = 1 THEN 'rechecking'
  WHEN ${quotations.isApprovedByAdmin} = 1 THEN 'pending'
  ELSE 'draft'
END`;
