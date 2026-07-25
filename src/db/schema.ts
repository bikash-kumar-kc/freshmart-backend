import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { roleEnum } from './utilis/role.constant';

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
