// admin-notifications/admin-notification.utils.ts
import { sql } from 'drizzle-orm';
import { notificationsVendorAdmin as n, quotations } from '../../db/schema';

export type AdminNotificationPill =
  | 'inventory_order'
  | 'quotation_countered'
  | 'quotation_approved'
  | 'vendor_registration'
  | 'productListed';

// The single source of truth for what the admin feed shows. NULL means "not shown":
// those rows are excluded from the list AND the unread count. To add a pill later, add a WHEN here.
export const pillSubTypeSql = sql<AdminNotificationPill | null>`CASE ${n.subType}
  WHEN 'vendor_registration_filed' THEN 'vendor_registration'
  WHEN 'vendor_added_product' THEN 'productListed'
  WHEN 'inventory_order' THEN 'inventory_order'
  WHEN 'vendor_replied_quotation' THEN
    CASE WHEN ${quotations.isVendorUpdatedTheQuotation} = 1 THEN 'quotation_countered' ELSE 'quotation_approved' END
  ELSE NULL
END`;

// Only vendor replies need the quotation row. A non-numeric referenceId casts to 0 and matches nothing.
export const quotationJoinOn = sql`${n.subType} = 'vendor_replied_quotation' AND ${quotations.id} = CAST(${n.referenceId} AS INTEGER)`;

// Derived from the mapped subtype, so it doesn't depend on what referenceType string each writer stored
export function resolveReferenceType(
  subType: AdminNotificationPill,
  referenceId: string | null,
  joinedQuotationId: number | null,
): 'quotation' | 'vendor' | 'productListing' | null {
  if (!referenceId) return null;
  switch (subType) {
    case 'vendor_registration':
      return 'vendor';
    case 'productListed':
      return 'productListing';
    case 'quotation_countered':
    case 'quotation_approved':
      return joinedQuotationId != null ? 'quotation' : null; // hard-deleted quotation: hide View
    default:
      return null; // inventory_order: the UI has no 'order' reference route yet
  }
}
