// redis/redis.provider.ts
import Redis from 'ioredis';

export const REDIS_PROVIDER = 'REDIS_CLIENT';

export const redisProvider = {
  provide: REDIS_PROVIDER,
  useFactory: () => {
    const isRedisUrl = !!process.env.REDIS_URL;
    if (!isRedisUrl) return;
    const redis = new Redis(process.env.REDIS_URL!);

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    redis.on('error', (err) => {
      console.error(' Redis Error:', err);
    });

    return redis;
  },
};
