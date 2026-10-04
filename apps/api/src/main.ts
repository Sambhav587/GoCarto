import {
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { env } from './config/env.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.enableShutdownHooks();

  app.use(helmet());

  app.enableCors({
  origin: [
    env.corsOrigin,
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8082',
  ],
  credentials: true,
});

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GoCarto API')
    .setDescription(
      'AI-powered quick-commerce grocery delivery platform API',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup(
    'docs',
    app,
    swaggerDocument,
  );

  await app.listen(env.port);
}

void bootstrap();