import {
  MiddlewareConsumer,
  Module,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CartModule } from './cart/cart.module.js';
import { HealthController } from './health.controller.js';
import { OrderModule } from './order/order.module.js';
import { ProductsModule } from './products/products.module.js';
import { UsersModule } from './users/users.module.js';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level:
          process.env['NODE_ENV'] === 'production'
            ? 'info'
            : 'debug',

        customProps: (request) => ({
          requestId: request.id,
        }),
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    AiModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CartModule,
    OrderModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(requestIdMiddleware)
      .forRoutes('*');
  }
}