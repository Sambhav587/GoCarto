import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { env } from '../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  imports: [
    JwtModule.register({
      secret: env.jwtSecret,
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule,
  ],
})
export class AuthModule {}