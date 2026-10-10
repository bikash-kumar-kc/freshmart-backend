export const notificationSubTypeEnum = [
  'vendor_registration_filed',
  'vendor_account_created',
  'vendor_added_product',
  'vendor_edited_product',
  'vendor_suggested_product_name',
  'vendor_replied_quotation',
  'product_approved',
  'product_rejected',
  'admin_filed_quotation',
  'display_order_request',
  'quotation_deleted',
  'stock_update_requested',
  'quotation_cancelled',
] as const;

export const notificationTypeEnum = ['vendor', 'admin'] as const;
