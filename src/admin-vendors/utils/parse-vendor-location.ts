// admin-vendors/utils/parse-vendor-location.ts
export function parseVendorLocation(addressLocation: string) {
  const parts = addressLocation.split(',').map((p) => p.trim());
  return {
    ward: parts[0] ?? '',
    municipality: parts[1] ?? '',
    district: parts[2] ?? '',
    province: parts[3] ?? '',
    country: parts[4] ?? '',
  };
}
