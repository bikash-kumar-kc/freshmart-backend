// common/utils/stock-status.utils.ts
import { eq, sql } from 'drizzle-orm';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from '../../db/schema';
import { products, productVariants } from '../../db/schema';

export const LOW_STOCK_THRESHOLD = 10;

export type StockStatus = 'on_stock' | 'low_stock' | 'out_of_stock';

export function computeStockStatus(availableStock: number): StockStatus {
  if (availableStock <= 0) return 'out_of_stock';
  if (availableStock < LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'on_stock';
}

// DB value -> value the admin UI expects
export const STOCK_STATUS_TO_API = {
  on_stock: 'in_stock',
  low_stock: 'low_stock',
  out_of_stock: 'out_of_stock',
} as const;

// UI filter value -> DB value
export const STOCK_FILTER_TO_COLUMN = {
  in_stock: 'on_stock',
  low_stock: 'low_stock',
  out_of_stock: 'out_of_stock',
} as const;

// Accepts either the db or a transaction. If your drizzle version rejects these generics, `any` is fine here.
type DbOrTx = BaseSQLiteDatabase<'async', any, typeof schema>;

export async function syncProductStockStatus(
  db: DbOrTx,
  productId: string,
): Promise<StockStatus> {
  const [row] = await db
    .select({
      available: sql<number>`COALESCE(SUM(MAX(${productVariants.stock} - ${productVariants.reservedStock}, 0)), 0)`,
    })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  const next = computeStockStatus(Number(row?.available ?? 0));
  await db
    .update(products)
    .set({ stockStatus: next })
    .where(eq(products.id, productId));
  return next;
}
