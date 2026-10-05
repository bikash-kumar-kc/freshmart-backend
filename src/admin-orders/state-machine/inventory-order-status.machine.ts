// admin-orders/inventory-order-status.machine.ts
export const INVENTORY_ORDER_TRANSITIONS: Record<string, string[]> = {
  packaging: ['ontheway', 'failed'],
  ontheway: ['delivered', 'failed'],
  delivered: [],
  failed: [],
};

export function isValidInventoryTransition(
  current: string,
  next: string,
): boolean {
  return INVENTORY_ORDER_TRANSITIONS[current]?.includes(next) ?? false;
}
