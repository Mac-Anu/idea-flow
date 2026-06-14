import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { isNil } from "lodash";
import { eq } from "drizzle-orm";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

import { getWorkerConnection } from "@/lib/queue";
import { serverIncs } from "../common/app";
import { syncArticleSearchDocument, deleteArticleSearchDocument } from "./search/service";
import { generateArticleEmbedding } from "./service";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { llm } from "../agent";

// ==========================================
// 队列推入函数 (Producer)
// ==========================================

export const addSearchSyncJob = async (articleId: string) => {
    if (!isNil(serverIncs.queues.ARTICLE_TASKS)) {
        await serverIncs.queues.ARTICLE_TASKS.add("searchSync", { articleId });
    } else {
        // Fallback for development without Redis
        try {
            await syncArticleSearchDocument(articleId);
        } catch (e) {}
    }
};

export const addSearchDeleteJob = async (articleId: string) => {
    if (!isNil(serverIncs.queues.ARTICLE_TASKS)) {
        await serverIncs.queues.ARTICLE_TASKS.add("searchDelete", { articleId });
    } else {
        try {
            await deleteArticleSearchDocument(articleId);
        } catch (e) {}
    }
};

export const addAiSummaryJob = async (articleId: string) => {
    if (!isNil(serverIncs.queues.ARTICLE_TASKS)) {
        await serverIncs.queues.ARTICLE_TASKS.add("aiSummary", { articleId });
    }
};

export const addEmbeddingJob = async (articleId: string) => {
    if (!isNil(serverIncs.queues.ARTICLE_TASKS)) {
        await serverIncs.queues.ARTICLE_TASKS.add("embedding", { articleId });
    } else {
        // 本地无 Redis 队列时降级为当场执行
        try {
            await generateArticleEmbedding(articleId);
        } catch (e) {}
    }
};

// ==========================================
// 队列消费进程 (Worker)
// ==========================================

export const addArticleTaskWorker = async () => {
    if (!isNil(serverIncs.queues.ARTICLE_TASKS)) {
        const worker = new Worker(
            "ARTICLE_TASKS",
            async (job: Job) => {
                const { articleId } = job.data;

                switch (job.name) {
                    case "searchSync":
                        await syncArticleSearchDocument(articleId);
                        break;

                    case "searchDelete":
                        await deleteArticleSearchDocument(articleId);
                        break;

                    case "aiSummary":
                        await generateAiSummary(articleId);
                        break;

                    case "embedding":
                        await generateArticleEmbedding(articleId);
                        break;

                    default:
                        console.warn(`[ArticleWorker] 未知的任务类型: ${job.name}`);
                }
            },
            { connection: getWorkerConnection("ARTICLE_TASKS", serverIncs.redis) },
        );

        worker.on("completed", (job) => {
            // console.log(`[ArticleWorker] 任务完成: ${job.name} (${job.data.articleId})`);
        });

        worker.on("failed", (job, err) => {
            console.error(`[ArticleWorker] 任务失败: ${job?.name} (${job?.data?.articleId})`, err);
        });
    }
};

// ==========================================
// AI 摘要生成逻辑 (Consumer Helper)
// ==========================================

const generateAiSummary = async (articleId: string) => {
    // 1. 获取文章内容
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId));
    if (!article || !article.content) return;

    // 如果已经有比较长的摘要（超过 30 个字），或者是人工填写的，则跳过
    // 为了全自动覆盖，只要 summary 为空或者和默认截断太像，就生成
    if (article.summary && article.summary.length > 50 && !article.summary.endsWith("...")) {
        return;
    }

    try {
        const systemPrompt = `你是一个专业的文章导读助手。请为用户提供的一段文本提取精炼的导读摘要（TL;DR）。
请使用一段简短流畅的文字，绝对不要超过200字。直接返回摘要，不要包含多余的寒暄，不要使用 Markdown 格式。`;

        // 截取前 3000 字防止 Token 爆炸
        const contentToRead = article.content.substring(0, 3000);

        const response = await llm.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`文章内容：\n${contentToRead}`),
        ]);

        const newSummary = response.content as string;

        // 2. 静默更新数据库中的 summary 字段 (不修改 updatedAt 防止覆盖用户正常操作的时间)
        await db.update(articles).set({ summary: newSummary }).where(eq(articles.id, articleId));

        // 3. 摘要更新后，需要重新同步一下搜索引擎
        await syncArticleSearchDocument(articleId);

        // 4. 摘要是 embedding 的输入之一，摘要变了就重算向量，保证语义检索用的是最新摘要
        await generateArticleEmbedding(articleId);
    } catch (error) {
        console.error(`[AI Summary Error] 无法生成摘要 (ID: ${articleId}):`, error);
        throw error; // 抛出异常让 BullMQ 重试
    }
};
