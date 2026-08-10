import Redis from 'ioredis';

export const REDIS_PROVIDER = 'REDIS_CLIENT';

export const redisProvider = {
  provide: REDIS_PROVIDER,
  useFactory: () => {
    const isRedisCredentialValid =
      !process.env.REDIS_URL ||
      !process.env.REDIS_URL ||
      !process.env.REDIS_USER ||
      !process.env.REDIS_PASSWORD;
    if (!isRedisCredentialValid) {
      console.log('Failed to get valid redis credential');
    }
    // const redis = new Redis(process.env.REDIS_URL!); // local redis server connection...
    const redis = new Redis({
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_URL,
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
    });

    // const redis = new Redis();

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    redis.on('error', (err) => {
      console.error(' Redis Error:', err);
    });

    return redis;
  },
};
