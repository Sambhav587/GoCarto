import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { db } from '../prisma/db.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';

@Injectable()
export class UsersService {
  private sanitizeUser(user: unknown) {
    if (!user || typeof user !== 'object') {
      return user;
    }

    const {
      passwordHash: _passwordHash,
      ...safeUser
    } = user as Record<string, unknown>;

    return safeUser;
  }

  async getUsers() {
    const users = await db.orm.public.User.all();

    return users.map((user) => this.sanitizeUser(user));
  }

  async createUser(data: {
    email: string;
    name?: string | null;
    username?: string | null;
  }) {
    try {
      const user = await db.orm.public.User.create({
        email: data.email,
        name: data.name ?? null,
        username: data.username ?? null,
        updatedAt: Temporal.Now.instant(),
      });

      return this.sanitizeUser(user);
    } catch (error: any) {
      if (
        error?.code === '23505' ||
        error?.constraint === 'User_email_key'
      ) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async getUserById(id: number) {
    const user = await db.orm.public.User.first({ id });

    if (!user) {
      throw new NotFoundException(
        `User with id ${id} not found`,
      );
    }

    return this.sanitizeUser(user);
  }

  async updateUser(id: number, data: UpdateUserDto) {
    const user = await db.orm.public.User.first({ id });

    if (!user) {
      throw new NotFoundException(
        `User with id ${id} not found`,
      );
    }

    const updatedUser = await db.orm.public.User.where({ id }).update({
      ...(data.email !== undefined && {
        email: data.email,
      }),
      ...(data.name !== undefined && {
        name: data.name,
      }),
      ...(data.username !== undefined && {
        username: data.username,
      }),
      updatedAt: Temporal.Now.instant(),
    });

    return this.sanitizeUser(updatedUser);
  }

  async deleteUser(id: number) {
    const user = await db.orm.public.User.first({ id });

    if (!user) {
      throw new NotFoundException(
        `User with id ${id} not found`,
      );
    }

    return await db.orm.public.User.where({ id }).delete();
  }
}