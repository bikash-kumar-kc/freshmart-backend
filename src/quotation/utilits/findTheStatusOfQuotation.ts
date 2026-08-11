import { QuotationStatus } from './../constants/quotation.status';
export const calculateTheStatus = ({
  isDelivered,
  isVendorApproved,
  isVendorUpdatedTheQuotation,
  isReapprovedByAdmin,
  //   isRejectedByAdmin,
}: Record<string, boolean>): QuotationStatus => {
  if (isDelivered) {
    return 'delivered';
  }

  if (isVendorApproved && !isVendorUpdatedTheQuotation && isReapprovedByAdmin) {
    return 'approved';
  }

  //   if (isRejectedByAdmin) {
  //     return 'rejected';
  //   }

  if (
    isVendorApproved &&
    !isVendorUpdatedTheQuotation &&
    !isReapprovedByAdmin
  ) {
    return 'rechecking';
  }

  if (isVendorApproved && isVendorUpdatedTheQuotation && !isReapprovedByAdmin) {
    return 'rechecking';
  }

  return 'request';
};
