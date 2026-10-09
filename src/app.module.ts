import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/db.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { VendorModule } from './vendor/vendor.module';
import * as Joi from 'joi';
import { QueueModule } from './queue/queue.module';
import { AdminModule } from './admin/admin.module';
import { NotificationModule } from './notification/notification.module';
import { QuotationModule } from './quotation/quotation.module';
import { ProductsModule } from './products/products.module';
import { DisplayOrderModule } from './display-order/display-order.module';
import { ImagekitModule } from './imagekit/imagekit.module';
import { LookupModule } from './lookup/lookup.module';
import { AdminOrdersModule } from './admin-orders/admin-orders.module';
import { AdminVendorsModule } from './admin-vendors/admin-vendors.module';
import { AdminProductListingModule } from './admin-product-listing/admin-product-listing.module';
import { AdminProductLiveModule } from './admin-product-live/admin-product-live.module';
import { AdminQuotationsModule } from './admin-quotations/admin-quotations.module';

@Module({
  imports: [
    // global rate limit for every routes...
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // injecting config module globally...
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),
        TURSO_DATABASE_URL: Joi.string().required(),
        TURSO_AUTH_TOKEN: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
        ALLOWED_ORIGINS: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    VendorModule,
    QueueModule,
    AdminModule,
    NotificationModule,
    QuotationModule,
    ProductsModule,
    DisplayOrderModule,
    ImagekitModule,
    LookupModule,
    AdminOrdersModule,
    AdminVendorsModule,
    AdminProductListingModule,
    AdminProductLiveModule,
    AdminQuotationsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule {}
