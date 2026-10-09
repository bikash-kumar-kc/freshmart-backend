// common/utils/product-format.utils.ts
export const formatSize = (value: number, unit: string) => `${value}${unit}`;

export const formatProductLabel = (name: string, sizes: string[]) =>
  sizes.length > 0 ? `${name} (${sizes.join(', ')})` : name;

// One value -> "100", several -> "(100, 50)". Callers must pass values in the same
// variant order as `sizes` so the three strings line up index for index.
export const formatMulti = (values: number[]) =>
  values.length === 0 ? '0' : values.length === 1 ? String(values[0]) : `(${values.join(', ')})`;