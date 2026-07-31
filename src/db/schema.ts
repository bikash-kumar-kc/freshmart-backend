import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { roleEnum } from './utilis/role.constant';
import { relations } from 'drizzle-orm';

import {
  notificationSubTypeEnum,
  notificationTypeEnum,
} from './utilis/notification.type';
import { real } from 'drizzle-orm/sqlite-core';

// user-table-with-update-columns
export const users = sqliteTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    email: text('email').notNull().unique(),
    password: text('password').notNull(), // bcrypt hash
    name: text('name'),

    role: text('role', { enum: roleEnum }).notNull().default('user'),

    vendorId: text('vendor_id').references(() => vendors.id, {
      onDelete: 'cascade',
    }),
    adminId: text('admin_id').references(() => admins.id), // cascade not specified — see note below

    isEmailVerified: integer('is_email_verified', { mode: 'boolean' })
      .notNull()
      .default(false),

    pushSubscription: text('push_subscription'),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    // updatedAt: text("updated_at"),
    // .notNull()
    // .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('users_vendor_idx').on(table.vendorId),
    index('users_admin_idx').on(table.adminId),
  ],
);

// vendor-table...
export const vendors = sqliteTable('vendors', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  farmName: text('farm_name').notNull(),
  farmOriginCountry: text('farm_origin_country').notNull(),
  farmDescription: text('farm_description'),
  farmOwner: text('farm_owner').notNull(),

  phoneNumber: text('phone_number').notNull(),
  addressLocation: text('address_location').notNull(),
  email: text('email').notNull(),

  vatNumber: text('vat_number'),
  panVatCertificateUrl: text('pan_vat_certificate_url').notNull(),
  certificates: text('certificates', { mode: 'json' })
    .$type<string[]>()
    .default(sql`'[]'`),

  isVendorApproved: integer('is_vendor_approved', { mode: 'boolean' })
    .notNull()
    .default(false),

  isEmailVerified: integer('is_email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

//category-for-product-listing...
export const category = sqliteTable('category', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryName: text('category_name').notNull().unique(),
  isVerified: integer('is_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

//product-name-for-product-listing...
export const productName = sqliteTable('product_name', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  isVerified: integer('is_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

//package-type-for-product-listing...
export const packagingType = sqliteTable('packaging_type', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  isVerified: integer('is_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

//measurementn-type-for-product-listing...
export const measurementType = sqliteTable('measurement_type', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // g, ml, pcs
  isVerified: integer('is_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

//product-listing...
export const productListing = sqliteTable(
  'product_listing',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => productName.id),

    type: text('type', { enum: ['inventory', 'display'] }).notNull(),
    localName: text('local_name'),
    categoryId: integer('category_id')
      .notNull()
      .references(() => category.id),
    keywords: text('keywords'),
    description: text('description'),
    images: text('images', { mode: 'json' })
      .$type<string[]>()
      .default(sql`'[]'`),

    originCountry: text('origin_country').notNull(),
    farmName: text('farm_name'),

    packagingTypeId: integer('packaging_type_id')
      .notNull()
      .references(() => packagingType.id),

    isTaxable: integer('is_taxable', { mode: 'boolean' })
      .notNull()
      .default(false),
    isAcceptedByAdmin: integer('is_accepted_by_admin', { mode: 'boolean' })
      .notNull()
      .default(false),

    isRejectedByAdmin: integer('is_rejected_by_admin', { mode: 'boolean' })
      .notNull()
      .default(false),

    isLived: integer('is_lived', { mode: 'boolean' }).default(false),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text('updated_at').default(sql`(current_timestamp)`),
  },
  (table) => [
    index('vendor_idx').on(table.vendorId),
    index('product_idx').on(table.productId),
  ],
);

// product-listing-variants...
export const productListingVariants = sqliteTable(
  'product_listing_variants',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    productListingId: integer('product_listing_id')
      .notNull()
      .references(() => productListing.id, { onDelete: 'cascade' }),

    size: integer('size').notNull(),
    measurementId: integer('measurement_id')
      .notNull()
      .references(() => measurementType.id),
    quantity: integer('quantity').notNull(),

    pricePerUnit: integer('price_per_unit').notNull(),
    sellingPrice: integer('selling_price'),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index('product_listing_idx').on(table.productListingId)],
);

// admin-table...
export const admins = sqliteTable('admins', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text('name').notNull(),
  companyName: text('company_name').notNull().default('FreshMart'),
  department: text('department').notNull(),
  designation: text('designation').notNull(),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const productListingRelations = relations(
  productListing,
  ({ many }) => ({ variants: many(productListingVariants) }),
);

export const productListingVariantsRelations = relations(
  productListingVariants,
  ({ one }) => {
    return {
      productListing: one(productListing, {
        fields: [productListingVariants.productListingId],
        references: [productListing.id],
      }),
    };
  },
);

export const orders = sqliteTable(
  'orders',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    isOrdered: integer('is_ordered', { mode: 'boolean' })
      .notNull()
      .default(false),

    isPayment: integer('is_payment', { mode: 'boolean' })
      .notNull()
      .default(false),

    isPaymentProcess: integer('is_payment_process', {
      mode: 'boolean',
    })
      .notNull()
      .default(false),

    orderStatus: text('order_status', {
      enum: ['delivered', 'ontheway', 'failed', 'pending', 'packaging'],
    }),

    isDeliveredChargeApplied: integer('is_delivered_charge_applied', {
      mode: 'boolean',
    })
      .notNull()
      .default(false),

    totalPriceAfterDiscount: integer('total_price_after_discount'),

    totalSave: integer('total_save'),

    totalPrice: integer('total_price'),

    userId: text('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),
    type: text('type', { enum: ['inventory', 'display'] })
      .notNull()
      .default('inventory'),
    vendorId: text('vendor_id').references(() => vendors.id),
    displayOrderStatus: text('display_order_status', {
      enum: ['pending', 'processing', 'delivered', 'cancelled'],
    }),
    vendorConfirmationDeadline: text('vendor_confirmation_deadline'),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),

    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('orders_user_idx').on(table.userId),
    index('orders_order_idx').on(table.id),
  ],
);

// order items table...
export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, {
        onDelete: 'cascade',
      }),

    productId: text('product_id')
      .notNull()
      .references(() => products.id, {
        onDelete: 'restrict',
      }),

    quantity: integer('quantity').notNull(),

    weightValue: integer('weight_value').notNull(),

    weightUnit: text('weight_unit', {
      enum: ['g', 'kg', 'l', 'ml'],
    }).notNull(),

    slug: text('slug').notNull(),

    // vendor id...
    vendorId: text('vendor_id').references(() => vendors.id),

    // product variant to deduct stock from correct variant...
    productVariantId: text('product_variant_id').references(
      () => productVariants.id,
    ),

    // productlistingid...
    productListingId: text('product_listing_id').references(
      () => productListing.id,
    ),
  },
  (table) => [
    index('order_items_order_idx').on(table.orderId),
    index('order_items_product_idx').on(table.productId),
  ],
);

export const products = sqliteTable(
  'products',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    categoryId: integer('category_id').references(() => category.id),
    productNameId: integer('product_name_id').references(() => productName.id),
    category: text('category'),
    packagingTypeId: integer('packaging_type_id').references(
      () => packagingType.id,
    ),
    localName: text('local_name').notNull(),

    // comma-separated search terms, e.g. "potato,aalu"

    keywords: text('keywords').notNull().default(''),

    description: text('description'),

    thumbnail: text('thumbnail'),
    // JSON array of image URLs
    images: text('images', { mode: 'json' })
      .notNull()
      .$type<string[]>()
      .default(sql`'[]'`),

    // small category/product icon — separate from thumbnail
    icon: text('icon'),

    // ── curation flags ──
    isMostPopular: integer('is_most_popular', { mode: 'boolean' })
      .notNull()
      .default(false),
    isFeatured: integer('is_featured', { mode: 'boolean' })
      .notNull()
      .default(false),

    // ── offers ──
    isOffered: integer('is_offered', { mode: 'boolean' }).default(false),

    // percentage, e.g. 20 = 20% off
    discount: real('discount').default(0),

    // renamed from isOfferedDateStartDate/EndDate — these are dates, not booleans
    offerStartDate: text('offer_start_date'),
    offerEndDate: text('offer_end_date'),

    // ── organic provenance ──
    originCountry: text('origin_country').notNull(),
    farmName: text('farm_name').notNull(),

    freshnessTags: text('freshness_tags', { mode: 'json' })
      .$type<string[]>()
      .default(sql`'[]'`),

    type: text('type', { enum: ['display', 'inventory'] }),

    // always an array now — even a single banner is ["url"]
    featuredBanner: text('featured_banner', { mode: 'json' })
      .$type<string[]>()
      .default(sql`'[]'`),

    // "active" | "draft" | "out_of_stock" | "discontinued"

    status: text('status').notNull().default('active'),
    expireAt: text('expire_at'),

    // popularity check -------------
    popularityScore: real('popularity_score').notNull().default(0),

    // vendor id...
    vendorId: text('vendor_id').references(() => vendors.id),

    // productlistingid...
    productListingId: integer('product_listing_id').references(
      () => productListing.id,
    ),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [
    index('products_slug_idx').on(table.slug),
    index('products_category_idx').on(table.category),
    index('products_status_idx').on(table.status),
  ],
);

export const notificationsVendorAdmin = sqliteTable(
  'notifications_vendor_admin',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    type: text('type', { enum: notificationTypeEnum }).notNull(),
    subType: text('sub_type', { enum: notificationSubTypeEnum }).notNull(),

    vendorId: text('vendor_id').references(() => vendors.id, {
      onDelete: 'cascade',
    }),

    referenceId: text('reference_id'),
    referenceType: text('reference_type'),

    message: text('message').notNull(),
    content: text('content'),

    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    readAt: text('read_at'),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index('notifications_vendor_idx').on(table.vendorId),
    index('notifications_type_idx').on(table.type),
  ],
);

export const quotations = sqliteTable(
  'quotations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    adminId: text('admin_id')
      .notNull()
      .references(() => admins.id),
    productListingId: integer('product_listing_id')
      .notNull()
      .references(() => productListing.id),

    isVendorUpdatedTheQuotation: integer('is_vendor_updated', {
      mode: 'boolean',
    })
      .notNull()
      .default(false),
    isApprovedByVendor: integer('is_approved_by_vendor', { mode: 'boolean' })
      .notNull()
      .default(false),
    isApprovedByAdmin: integer('is_approved_by_admin', { mode: 'boolean' })
      .notNull()
      .default(false),
    isReapprovedByAdmin: integer('is_reapproved_by_admin', { mode: 'boolean' })
      .notNull()
      .default(false),

    isDelivered: integer('is_delivered', { mode: 'boolean' })
      .notNull()
      .default(false),
    isLived: integer('is_lived', { mode: 'boolean' }).notNull().default(false),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index('quotations_vendor_idx').on(table.vendorId)],
);

export const quotationVariants = sqliteTable('quotation_variants', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  quotationId: integer('quotation_id')
    .notNull()
    .references(() => quotations.id, { onDelete: 'cascade' }),
  productListingVariantId: integer('product_listing_variant_id')
    .notNull()
    .references(() => productListingVariants.id),

  originalPricePerUnit: integer('original_price_per_unit').notNull(),
  adminSuggestedPricePerUnit: integer(
    'admin_suggested_price_per_unit',
  ).notNull(),
  vendorCounterPricePerUnit: integer('vendor_counter_price_per_unit'),

  quantity: integer('quantity').notNull(),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const quotationProductsRelations = relations(quotations, ({ many }) => ({
  variants: many(quotationVariants),
}));

export const quotationProductVariantsRelations = relations(
  quotationVariants,
  ({ one }) => ({
    product: one(quotations, {
      fields: [quotationVariants.quotationId],
      references: [quotations.id],
    }),
  }),
);

export const productVariants = sqliteTable(
  'product_variants',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    weightValue: real('weight_value').notNull(),
    weightUnit: text('weight_unit'),
    measurementTypeId: integer('measurement_type_id').references(
      () => measurementType.id,
    ),

    price: real('price').notNull(),
    stock: integer('stock').notNull().default(0),
    reservedStock: integer('reserved_stock').notNull().default(0),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [index('product_variants_product_idx').on(table.productId)],
);

// export const quotationRelation = relations(quotations, ({ many }) => ({
//   variants: many(quotationVariants),
// }));

// export const quotationProductVariantsRelations = relations(
//   productListingVariants,
//   ({ one }) => {
//     return {
//       productListing: one(productListing, {
//         fields: [productListingVariants.productListingId],
//         references: [productListing.id],
//       }),
//     };
//   },
// );
