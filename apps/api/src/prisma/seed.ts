import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { db } from './db.js';

const categories = [
  {
    name: 'Fruits',
    slug: 'fruits',
  },
  {
    name: 'Vegetables',
    slug: 'vegetables',
  },
  {
    name: 'Dairy',
    slug: 'dairy',
  },
  {
    name: 'Bakery',
    slug: 'bakery',
  },
  {
    name: 'Snacks',
    slug: 'snacks',
  },
  {
    name: 'Beverages',
    slug: 'beverages',
  },
];

const products = [
  {
    categorySlug: 'fruits',
    name: 'Fresh Bananas',
    slug: 'fresh-bananas',
    description: 'Fresh ripe bananas, perfect for breakfast and smoothies.',
    price: 49,
    unit: '1 kg',
    stockQuantity: 50,
  },
  {
    categorySlug: 'fruits',
    name: 'Red Apples',
    slug: 'red-apples',
    description: 'Crisp and naturally sweet red apples.',
    price: 149,
    unit: '1 kg',
    stockQuantity: 35,
  },
  {
    categorySlug: 'fruits',
    name: 'Fresh Oranges',
    slug: 'fresh-oranges',
    description: 'Juicy oranges packed with natural citrus flavor.',
    price: 89,
    unit: '1 kg',
    stockQuantity: 40,
  },
  {
    categorySlug: 'vegetables',
    name: 'Fresh Tomatoes',
    slug: 'fresh-tomatoes',
    description: 'Fresh red tomatoes for everyday cooking.',
    price: 39,
    unit: '1 kg',
    stockQuantity: 60,
  },
  {
    categorySlug: 'vegetables',
    name: 'Potatoes',
    slug: 'potatoes',
    description: 'Everyday farm-fresh potatoes.',
    price: 35,
    unit: '1 kg',
    stockQuantity: 70,
  },
  {
    categorySlug: 'vegetables',
    name: 'Green Broccoli',
    slug: 'green-broccoli',
    description: 'Fresh green broccoli florets.',
    price: 79,
    unit: '500 g',
    stockQuantity: 25,
  },
  {
    categorySlug: 'dairy',
    name: 'Farm Fresh Milk',
    slug: 'farm-fresh-milk',
    description: 'Fresh full-cream milk for your daily needs.',
    price: 64,
    unit: '1 litre',
    stockQuantity: 45,
  },
  {
    categorySlug: 'dairy',
    name: 'Greek Yogurt',
    slug: 'greek-yogurt',
    description: 'Creamy high-protein Greek yogurt.',
    price: 99,
    unit: '400 g',
    stockQuantity: 30,
  },
  {
    categorySlug: 'dairy',
    name: 'Salted Butter',
    slug: 'salted-butter',
    description: 'Smooth salted butter for cooking and breakfast.',
    price: 58,
    unit: '100 g',
    stockQuantity: 28,
  },
  {
    categorySlug: 'bakery',
    name: 'Brown Bread',
    slug: 'brown-bread',
    description: 'Soft whole-wheat brown bread.',
    price: 45,
    unit: '400 g',
    stockQuantity: 32,
  },
  {
    categorySlug: 'bakery',
    name: 'Multigrain Bread',
    slug: 'multigrain-bread',
    description: 'Nutritious bread made with multiple grains.',
    price: 65,
    unit: '400 g',
    stockQuantity: 24,
  },
  {
    categorySlug: 'bakery',
    name: 'Butter Croissant',
    slug: 'butter-croissant',
    description: 'Flaky and buttery freshly baked croissant.',
    price: 55,
    unit: '1 piece',
    stockQuantity: 20,
  },
  {
    categorySlug: 'snacks',
    name: 'Classic Potato Chips',
    slug: 'classic-potato-chips',
    description: 'Crispy classic salted potato chips.',
    price: 30,
    unit: '100 g',
    stockQuantity: 50,
  },
  {
    categorySlug: 'snacks',
    name: 'Roasted Almonds',
    slug: 'roasted-almonds',
    description: 'Crunchy roasted almonds with a rich nutty taste.',
    price: 180,
    unit: '200 g',
    stockQuantity: 22,
  },
  {
    categorySlug: 'snacks',
    name: 'Granola Bar',
    slug: 'granola-bar',
    description: 'Convenient oat and nut snack for busy days.',
    price: 40,
    unit: '1 piece',
    stockQuantity: 35,
  },
  {
    categorySlug: 'beverages',
    name: 'Orange Juice',
    slug: 'orange-juice',
    description: 'Refreshing orange juice with a bright citrus taste.',
    price: 110,
    unit: '1 litre',
    stockQuantity: 25,
  },
  {
    categorySlug: 'beverages',
    name: 'Cold Coffee',
    slug: 'cold-coffee',
    description: 'Smooth ready-to-drink chilled coffee.',
    price: 90,
    unit: '300 ml',
    stockQuantity: 30,
  },
  {
    categorySlug: 'beverages',
    name: 'Sparkling Water',
    slug: 'sparkling-water',
    description: 'Refreshing sparkling water.',
    price: 45,
    unit: '750 ml',
    stockQuantity: 40,
  },
];

async function upsertCategory(
  name: string,
  slug: string,
) {
  const existing = await db.orm.public.Category.first({
    slug,
  });

  if (existing) {
    return await db.orm.public.Category.where({
      id: existing.id,
    }).update({
      name,
      slug,
      updatedAt: Temporal.Now.instant(),
    });
  }

  return await db.orm.public.Category.create({
    name,
    slug,
    updatedAt: Temporal.Now.instant(),
  });
}

async function upsertProduct(product: (typeof products)[number]) {
  const category = await db.orm.public.Category.first({
    slug: product.categorySlug,
  });

  if (!category) {
    throw new Error(
      `Category not found: ${product.categorySlug}`,
    );
  }

  const existing = await db.orm.public.Product.first({
    slug: product.slug,
  });

  if (existing) {
    return await db.orm.public.Product.where({
      id: existing.id,
    }).update({
      categoryId: category.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      unit: product.unit,
      stockQuantity: product.stockQuantity,
      isActive: true,
      updatedAt: Temporal.Now.instant(),
    });
  }

  return await db.orm.public.Product.create({
    categoryId: category.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    unit: product.unit,
    stockQuantity: product.stockQuantity,
    isActive: true,
    updatedAt: Temporal.Now.instant(),
  });
}

async function main() {
  console.log('🌱 Starting GoCarto catalogue seed...');

  for (const category of categories) {
    await upsertCategory(
      category.name,
      category.slug,
    );
  }

  console.log(
    `✅ Seeded ${categories.length} grocery categories`,
  );

  for (const product of products) {
    await upsertProduct(product);
  }

  console.log(
    `✅ Seeded ${products.length} grocery products`,
  );

  console.log('🎉 GoCarto catalogue seed completed.');
}

main()
  .catch((error) => {
    console.error('❌ Catalogue seed failed:', error);
    process.exitCode = 1;
  });