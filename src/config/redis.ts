import type { RedisConfig } from '@/lib/redis';

export const redisConfig: RedisConfig = {
    default: 'default',
    connections: [
        {
            name: 'default',
            host: process.env.REDIS_HOST || 'localhost',
            port: Number.parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            db: Number.parseInt(process.env.REDIS_DB || '0'),
            maxRetriesPerRequest: null,
        },
    ],
};
