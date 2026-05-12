import { Env, Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { createRedisClients } from "@/lib/redis";
import { ServerIncs } from "./type";
import { createQueues } from "@/lib/queue";
import { addUserQueueWorker } from "../user/queue";
import { createMeilisearchClients } from "@/lib/meilisearch";
import { ensureArticleSearchIndex } from "../articles/search/service";

// 重新导出 getBaseUrl 以保持向后兼容性
export { getBaseUrl } from "@/lib/app";
/**
 * 创建Hono应用
 */
export const createHonoApp = <E extends Env>() => {
    const app = new Hono<E>();
    app.use(prettyJSON());
    return app;
};
/**
 * 启动时服务器后的常驻内存变量
 */
export const serverIncs: ServerIncs = {
    redis: {},
    queues: {},
    meilisearch: {},
};

/**
 * 服务器启动函数
 */
export const beforeServer = async () => {
    serverIncs.redis = createRedisClients();
    serverIncs.queues = createQueues(serverIncs.redis);
    await addUserQueueWorker();

    // MeiliSearch 初始化：优雅降级，连不上不影响核心功能（登录、验证码等）
    try {
        serverIncs.meilisearch = createMeilisearchClients();
        await ensureArticleSearchIndex();
        console.log('[MeiliSearch] ✅ 搜索引擎初始化成功');
    } catch (error) {
        console.warn('[MeiliSearch] ⚠️ 搜索引擎初始化失败，全文搜索功能暂不可用:', (error as Error).message);
    }
};
