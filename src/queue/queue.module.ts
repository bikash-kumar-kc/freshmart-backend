import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_URL'),
          port: configService.get<number>('REDIS_PORT'),
          username: configService.get<string>('REDIS_USER'),
          password: configService.get<string>('REDIS_PASSWORD'),
          maxRetriesPerRequest: null,
        },
      }),
    }),

    BullModule.registerQueue({ name: 'otp-email' }),
    BullModule.registerQueue({ name: 'display-order-timeout' }),

    NotificationModule,
  ],
  exports: [BullModule],
})
export class QueueModule {}
