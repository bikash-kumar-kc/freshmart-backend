import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL },
    }),
    BullModule.registerQueue({ name: 'otp-email' }),
    BullModule.registerQueue({ name: 'display-order-timeout' }),
    NotificationModule,
  ],
  exports: [BullModule],
})
export class QueueModule {}
