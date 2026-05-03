import type { QueueOptions } from "bullmq";
import type Redis from "ioredis";

import { Queue } from "bullmq";
import { isNil } from "lodash";

import { queueConfig } from "@/config/queue";

export interface QueueOption extends Omit<QueueOptions, "connection"> {
    redis: string;
}
export interface QueueConfig {
    [key: string]: QueueOption;
}

export const createQueues = (redisClients: { [key: string]: Redis }) => {
    const queues: { [key: string]: Queue } = {};
    const names = Object.keys(queueConfig);
    for (const name of names) {
        const { redis, ...options } = queueConfig[name];
        if (isNil(redisClients[redis]))
            throw new Error(`Redis client "${redis}" for queue "${name}" not found`);
        queues[name] = new Queue(name, { connection: redisClients[redis], ...options });
    }
    return queues;
};

export const getWorkerConnection = (queueName: string, redisClients: { [key: string]: Redis }) => {
    const { redis } = queueConfig[queueName];
    if (isNil(redisClients[redis]))
        throw new Error(`Redis client "${redis}" for queue "${queueName}" not found`);
    return redisClients[redis];
};
