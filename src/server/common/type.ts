import type { Queue } from "bullmq";
import type Redis from "ioredis";
import type { Meilisearch } from "meilisearch";

/**
 * 启动时服务器后的常驻内存变量类型
 */
export interface ServerIncs {
    redis: { [key: string]: Redis };
    queues: { [key: string]: Queue };
    meilisearch: { [key: string]: Meilisearch };
}
