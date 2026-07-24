import { Module, Global } from '@nestjs/common';
import { redisProvider, REDIS_PROVIDER } from './redis.provider';

@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS_PROVIDER],
})
export class RedisModule {}
