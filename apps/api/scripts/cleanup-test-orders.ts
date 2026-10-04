import 'dotenv/config';
import 'temporal-polyfill/full/global';

import { db } from '../src/prisma/db.js';

const KEEP_ORDER_ID = 24;

const orderItems = await db.orm.public.OrderItem
  .where({
    orderId: KEEP_ORDER_ID,
  })
  .all();

const orders = await db.orm.public.Order.all();

let deletedOrders = 0;
let deletedItems = 0;

for (const order of orders) {
  if (order.id === KEEP_ORDER_ID) {
    continue;
  }

  const items = await db.orm.public.OrderItem
    .where({
      orderId: order.id,
    })
    .all();

  for (const item of items) {
    await db.orm.public.OrderItem
      .where({
        id: item.id,
      })
      .delete();

    deletedItems += 1;
  }

  await db.orm.public.Order
    .where({
      id: order.id,
    })
    .delete();

  deletedOrders += 1;
}

console.log(
  `Cleanup complete. Kept order #${KEEP_ORDER_ID}.`,
);

console.log(
  `Deleted ${deletedOrders} orders and ${deletedItems} order items.`,
);

console.log(
  `Kept order #${KEEP_ORDER_ID} with ${orderItems.length} existing items.`,
);