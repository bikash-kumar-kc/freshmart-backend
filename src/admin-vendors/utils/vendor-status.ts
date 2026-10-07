// admin-vendors/utils/vendor-status.ts
export function deriveVendorStatus(vendor: {
  isVendorApproved: boolean;
  isDeleted: boolean;
}): 'approved' | 'unapproved' | 'deleted' {
  if (vendor.isDeleted) return 'deleted';
  return vendor.isVendorApproved ? 'approved' : 'unapproved';
}
