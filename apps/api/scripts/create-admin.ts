import 'dotenv/config';
import bcrypt from 'bcryptjs';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { db } from '../src/prisma/db.js';

const email = process.env['ADMIN_EMAIL'];
const password = process.env['ADMIN_PASSWORD'];

if (!email || !password) {
  throw new Error(
    'ADMIN_EMAIL and ADMIN_PASSWORD must be set.',
  );
}

const existingUser =
  await db.orm.public.User.first({
    email,
  });

const passwordHash =
  await bcrypt.hash(password, 12);

if (existingUser) {
  await db.orm.public.User.where({
    id: existingUser.id,
  }).update({
    role: 'admin',
    passwordHash,
    updatedAt: Temporal.Now.instant(),
  });

  console.log(
    `Admin role updated for ${email}`,
  );
} else {
  await db.orm.public.User.create({
    email,
    passwordHash,
    role: 'admin',
    name: 'GoCarto Admin',
    username: 'admin',
    updatedAt: Temporal.Now.instant(),
  });

  console.log(
    `Admin account created for ${email}`,
  );
}