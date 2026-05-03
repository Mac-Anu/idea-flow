import Redis, { type RedisOptions } from 'ioredis';
import { isNil, omit } from 'lodash';
import { redisConfig } from '@/config/redis';

/**
 * Redis 连接配置选项
 */
export interface RedisOption extends RedisOptions {
    name: string;
}

/**
 * Redis 配置类型
 */
export interface RedisConfig {
    /**
     * 默认连接名称
     */
    default: string;
    /**
     * 连接列表
     */
    connections: RedisOption[];
}

export const createRedisClients = () => {
    const clients: { [key: string]: Redis } = {};
    for (const conn of redisConfig.connections) {
        clients[conn.name] = new Redis(omit(conn, 'name'));
    }
    return clients;
};

export const getRedisClient = (clients: { [key: string]: Redis }, name?: string) => {
    const cName = name ?? redisConfig.default;
    if (isNil(clients[cName])) throw new Error(`Redis client "${cName}" not found`);
    return clients[cName];
};
