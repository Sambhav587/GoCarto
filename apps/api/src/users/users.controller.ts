import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { UsersService } from './users.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers() {
    return await this.usersService.getUsers();
  }

  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.usersService.getUserById(id);
  }

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return await this.usersService.createUser(data);
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(id, data);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.usersService.deleteUser(id);
  }
}