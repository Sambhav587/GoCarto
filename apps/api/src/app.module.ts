import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CartModule } from './cart/cart.module.js';
import { OrderModule } from './order/order.module.js';
import { ProductsModule } from './products/products.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ProductsModule,
    CartModule,
    OrderModule,
  ],
})
export class AppModule {}