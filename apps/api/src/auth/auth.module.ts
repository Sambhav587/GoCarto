import 'dotenv/config';

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET environment variable is required',
  );
}

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
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