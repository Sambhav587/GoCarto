import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CartModule } from '../cart/cart.module.js';
import { ProductsModule } from '../products/products.module.js';

import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';

@Module({
  imports: [
    AuthModule,
    ProductsModule,
    CartModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}