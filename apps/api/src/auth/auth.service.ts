import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { db } from '../prisma/db.js';
import { LoginDto } from './login.dto.js';
import { RegisterDto } from './register.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(data: RegisterDto) {
    const existingUser = await db.orm.public.User.first({
      email: data.email,
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await db.orm.public.User.create({
      email: data.email,
      name: data.name ?? null,
      username: data.username ?? null,
      passwordHash,
      role: 'customer',
      updatedAt: Temporal.Now.instant(),
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
    };
  }

  async login(data: LoginDto) {
    const user = await db.orm.public.User.first({
      email: data.email,
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    };
  }
}