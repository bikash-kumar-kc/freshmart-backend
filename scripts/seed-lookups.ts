import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import 'dotenv/config';
import * as schema from '../src/db/schema';
import { category, measurementType, packagingType } from '../src/db/schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Grains & Cereals',
  'Pulses & Lentils',
];

const MEASUREMENT_TYPES = ['g', 'ml', 'pcs'];

const PACKAGING_TYPES = ['box', 'jars', 'carton', 'bottle', 'sack'];

// scripts/seed-lookups.ts (addition)
import { productName } from '../src/db/schema';

const PRODUCT_NAMES = [
  // Vegetables
  'Potato',
  'Tomato',
  'Onion',
  'Cauliflower',
  'Cabbage',
  'Carrot',
  'Spinach',
  'Brinjal',
  'Cucumber',
  'Green Chili',

  // Fruits
  'Apple',
  'Banana',
  'Orange',
  'Mango',
  'Guava',
  'Papaya',
  'Watermelon',
  'Grapes',
  'Pomegranate',
  'Pineapple',

  // Dairy & Eggs
  'Milk',
  'Curd',
  'Ghee',
  'Paneer',
  'Butter',
  'Cheese',
  'Egg',
  'Cream',
  'Buttermilk',
  'Khoa',

  // Grains & Cereals
  'Rice',
  'Wheat Flour',
  'Maize',
  'Oats',
  'Barley',
  'Millet',
  'Semolina',
  'Beaten Rice',
  'Puffed Rice',
  'Corn Flour',

  // Pulses & Lentils
  'Lentil (Masoor)',
  'Chickpea',
  'Black Gram',
  'Green Gram',
  'Kidney Bean',
  'Pigeon Pea',
  'Soybean',
  'Black-eyed Pea',
  'Horse Gram',
  'Split Pea',
];

async function seedProductNames() {
  for (const name of PRODUCT_NAMES) {
    await db
      .insert(productName)
      .values({ name, isVerified: true })
      .onConflictDoNothing();
  }
  console.log(`✓ Seeded ${PRODUCT_NAMES.length} product names`);
}

async function seedCategories() {
  for (const name of CATEGORIES) {
    await db
      .insert(category)
      .values({ categoryName: name })
      .onConflictDoNothing();
  }
  console.log(`✓ Seeded ${CATEGORIES.length} categories`);
}

async function seedMeasurementTypes() {
  for (const name of MEASUREMENT_TYPES) {
    await db
      .insert(measurementType)
      .values({ name, isVerified: true })
      .onConflictDoNothing();
  }
  console.log(`✓ Seeded ${MEASUREMENT_TYPES.length} measurement types`);
}

async function seedPackagingTypes() {
  for (const name of PACKAGING_TYPES) {
    await db
      .insert(packagingType)
      .values({ name, isVerified: true })
      .onConflictDoNothing();
  }
  console.log(`✓ Seeded ${PACKAGING_TYPES.length} packaging types`);
}

async function main() {
  console.log('Seeding lookup tables...');
  await seedCategories();
  await seedMeasurementTypes();
  await seedPackagingTypes();
  await seedProductNames()
  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
