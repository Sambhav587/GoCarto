import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginDto } from './login.dto.js';
import { RegisterDto } from './register.dto.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return await this.authService.register(data);
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    return await this.authService.login(data);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Get('admin-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminTest(@Req() request: AuthenticatedRequest) {
    return {
      message: 'Admin access granted',
      user: request.user,
    };
  }
}