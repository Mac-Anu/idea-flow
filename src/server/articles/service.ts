import { isNil } from "lodash";
import pinyin from "pinyin";
import crypto from "crypto";
import { db } from "@/db";
import { articles, articleChunks, user } from "@/db/schema";
import { eq, or, isNull, desc, isNotNull, ilike, and, cosineDistance, sql } from "drizzle-orm";
import { CreateArticleInput, UpdateArticleInput } from "./type";
import { searchArticlesWithMeili } from "./search/service";
import { addSearchSyncJob, addSearchDeleteJob, addAiSummaryJob, addEmbeddingJob } from "./queue";
import { getRedisClient } from "@/lib/redis";
import { serverIncs } from "../common/app";
import { embedText, buildArticleEmbeddingText, chunkArticle } from "../agent/embedding";
import { rerankByRelevance } from "../agent/rerank";

const getAiUserId = async () => {
    const aiUser = await db.query.user.findFirst({
        where: eq(user.email, "ai_bot@ideaflow.local")
    });
    return aiUser?.id || "NO_AI_USER";
};

/**
 * 判断字符串是否为合法的 UUID 格式
 * 用于区分传入的标识是文章 ID(UUID) 还是 slug(别名)
 */
const isUuid = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/**
 * 统一清除一篇文章的所有相关缓存
 * 写操作（更新/删除/发布/取消发布/置顶）后调用，避免脏数据导致页面不更新或 404
 *
 * @param article - 受影响的文章记录（至少包含 id，可选 slug）
 * @param userId - 文章所属用户 ID（用于清该用户的标签缓存）
 * @param oldSlug - 若本次操作改动了 slug，传入旧 slug 一并清除其详情缓存
 */
const invalidateArticleCache = async (
    article: { id: string; slug?: string | null },
    userId?: string,
    oldSlug?: string | null,
) => {
    try {
        const redis = getRedisClient(serverIncs.redis);
        const keys = [
            "articles:public:list",                 // 公开列表缓存（无条件清，草稿/置顶变动都影响它）
            `article:detail:${article.id}`,          // 按 id 访问的详情缓存
        ];
        if (article.slug) keys.push(`article:detail:${article.slug}`);   // 新 slug 详情缓存
        if (oldSlug && oldSlug !== article.slug) keys.push(`article:detail:${oldSlug}`); // 旧 slug 详情缓存
        if (userId) keys.push(`tags:all:${userId}`);  // 该用户标签缓存
        await redis.del(...keys);
    } catch (e) {
        console.warn("Redis cache clear error:", e);
    }
};

/**
 * 复合查询单篇文章
 * 尝试通过文章 ID 或 Slug 进行精确匹配
 *
 * @param arg - 文章的 UUID 或别名 (slug)
 * @returns 匹配的文章实体，若未找到则返回 null
 */
export const queryArticleItem = async (arg: string) => {
    const redis = getRedisClient(serverIncs.redis);
    const cacheKey = `article:detail:${arg}`;

    // 优先查缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    // 关键：id 列是 UUID 类型，若 arg 不是合法 UUID 就拿去比 id，
    // Postgres 会直接抛 "invalid input syntax for type uuid" 错误。
    // 因此只有 arg 是 UUID 时才匹配 id，否则只按 slug 查。
    const condition = isUuid(arg)
        ? or(eq(articles.id, arg), eq(articles.slug, arg))
        : eq(articles.slug, arg);

    const [item] = await db
        .select()
        .from(articles)
        .where(condition);

    if (isNil(item)) {
        return null;
    }

    // 写入缓存，过期时间 1 小时
    await redis.setex(cacheKey, 3600, JSON.stringify(item));
    return item;
};

/**
 * 根据 ID 查询单篇文章
 * 
 * @param id - 文章的全局唯一标识符 (UUID)
 * @returns 匹配的文章实体，若未找到则返回 null
 */
export const queryArticleId = async (id: string) => {
    const [item] = await db.select().from(articles).where(eq(articles.id, id));
    if (isNil(item)) {
        return null;
    }
    return item;
};

/**
 * 根据别名 (Slug) 查询单篇文章
 * 常用于对 SEO 友好的公开 URL 解析
 * 
 * @param slug - 文章的 URL 别名
 * @returns 匹配的文章实体，若未找到则返回 null
 */
export const queryArticleSlug = async (slug: string) => {
    const [item] = await db.select().from(articles).where(eq(articles.slug, slug));
    if (isNil(item)) {
        return null;
    }
    return item;
};

/**
 * 根据标题自动生成唯一的 Slug (URL 别名)
 * 转换汉字为拼音，过滤特殊字符，自动去重
 * 
 * @param title - 文章标题
 * @returns 唯一的 slug 字符串
 */
export const generateUniqueSlug = async (title: string): Promise<string> => {
    const pyList = pinyin(title, {
        style: "normal"
    });
    
    let baseSlug = pyList
        .map(item => item[0])
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9\-]+/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 200) // 限制最大长度 200，留出空间给后缀，防止超出 DB 255 限制
        .replace(/-$/, ""); // 如果截断刚好切在连字符上，去掉尾部的连字符
        
    if (!baseSlug) {
        baseSlug = "article";
    }
    
    let slug = baseSlug;
    let count = 0;
    while (true) {
        const [existing] = await db
            .select()
            .from(articles)
            .where(eq(articles.slug, slug));
            
        if (!existing) {
            break;
        }
        
        count++;
        slug = `${baseSlug}-${count}`;
    }
    
    return slug;
};

/**
 * 创建新文章
 * 支持指定 ID 创建或自动生成 ID，会自动绑定当前用户
 * 
 * @param data - 文章创建负载数据 (CreateArticleInput)
 * @param userId - 当前操作用户的 ID
 * @returns 创建成功的文章记录
 */
export const createArticleItem = async (data: CreateArticleInput, userId: string) => {
    const slug = data.slug || await generateUniqueSlug(data.title);
    
    const insertData = data.id
        ? { ...data, slug, userId }
        : { title: data.title, content: data.content, summary: data.summary, slug, tags: data.tags, userId };
    const [createArticle] = await db
        .insert(articles)
        .values(insertData)
        .returning();
    
    // 触发搜索引擎同步与 AI 摘要生成 (放入后台队列)
    if (createArticle) {
        addSearchSyncJob(createArticle.id).catch(e => console.warn('Queue error:', e));
        addAiSummaryJob(createArticle.id).catch(e => console.warn('Queue error:', e));
        addEmbeddingJob(createArticle.id).catch(e => console.warn('Queue error:', e));
    }

    return createArticle;
};

/**
 * 更新现有文章信息
 * 严格校验操作权限，仅允许原作者更新
 * 
 * @param id - 目标文章 ID
 * @param data - 增量更新负载数据 (UpdateArticleInput)
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 更新后的文章记录
 */
export const updateArticleItem = async (id: string, data: UpdateArticleInput, userId: string) => {
    const aiUserId = await getAiUserId();
    // 先取旧记录，拿到旧 slug，以便 slug 改变时连旧 slug 的缓存一并清除
    const oldArticle = await queryArticleId(id);
    const [updateArticle] = await db
        .update(articles)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(articles.id, id), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))))
        .returning();

    // 触发后台任务队列和缓存清理
    if (updateArticle) {
        addSearchSyncJob(updateArticle.id).catch(e => console.warn('Queue error:', e));
        addAiSummaryJob(updateArticle.id).catch(e => console.warn('Queue error:', e));
        addEmbeddingJob(updateArticle.id).catch(e => console.warn('Queue error:', e));
        await invalidateArticleCache(updateArticle, userId, oldArticle?.slug);
    }

    return updateArticle;
};

/**
 * 软删除文章
 * 并非物理删除，而是标记 deleteAt 时间戳，以便回收站管理
 * 
 * @param id - 目标文章 ID
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 被软删除的文章记录
 */
export const deleteArticleItem = async (id: string, userId: string) => {
    const aiUserId = await getAiUserId();
    const [deleteArticle] = await db
        .update(articles)
        .set({ deleteAt: new Date() })
        .where(and(eq(articles.id, id), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))))
        .returning();
    
    // 从搜索引擎后台移除软删除的文章并清理缓存
    if (deleteArticle) {
        addSearchDeleteJob(deleteArticle.id).catch(e => console.warn('Queue error:', e));
        await invalidateArticleCache(deleteArticle, userId);
    }

    return deleteArticle;
};

/**
 * 获取当前用户的文章列表 (不包含回收站数据)
 * 默认按更新时间降序排列
 * 
 * @param userId - 目标用户 ID
 * @returns 文章列表数组
 */
export const queryArticleList = async (userId: string) => {
    const aiUserId = await getAiUserId();

    const articleList = await db
        .select()
        .from(articles)
        .where(
            and(
                isNull(articles.deleteAt),
                or(eq(articles.userId, userId), eq(articles.userId, aiUserId))
            )
        )
        .orderBy(desc(articles.updatedAt));
        
    return articleList.map(article => ({
        ...article,
        isAIGenerated: article.userId === aiUserId
    }));
};

/**
 * 获取当前用户的回收站文章列表
 * 即已被软删除 (deleteAt 不为空) 的记录
 * 
 * @param userId - 目标用户 ID
 * @returns 处于回收站状态的文章列表数组
 */
export const queryArticleTrashList = async (userId: string) => {
    const aiUserId = await getAiUserId();
    const trashList = await db
        .select()
        .from(articles)
        .where(and(isNotNull(articles.deleteAt), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))));
    return trashList;
};

/**
 * 从回收站中恢复文章
 * 清除文章的 deleteAt 标记
 * 
 * @param id - 目标文章 ID
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 执行恢复操作后的文章结果
 */
export const restoreArticleItem = async (id: string, userId: string) => {
    const aiUserId = await getAiUserId();
    const restoreArticle = await db
        .update(articles)
        .set({ deleteAt: null })
        .where(and(eq(articles.id, id), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))));
    return restoreArticle;
};

/**
 * 检索/全文搜索文章 (已升级为 Meilisearch 引擎)
 * 支持仅搜标题，或标题+正文联合检索。自动过滤已删除数据。
 * 
 * @param query - 搜索关键字
 * @param titleOnly - 是否仅在标题中检索 (默认: false)
 * @param userId - 当前操作用户的 ID
 * @returns 符合条件的文章列表（携带 _formatted 高亮字段）
 */
export const searchArticles = async (query: string, titleOnly: boolean = false, userId: string) => {
    // 调用我们在 search/service.ts 里封装的高级搜索引擎接口
    const searchResults = await searchArticlesWithMeili(query, titleOnly, userId);
    return searchResults;
};

/**
 * 聚合查询当前用户使用过的所有有效标签
 * 提取所有未删除文章内的标签数组，展平并去重
 * 
 * @param userId - 目标用户 ID
 * @returns 不重复的标签字符串数组
 */
export const queryAllTags = async (userId: string) => {
    const redis = getRedisClient(serverIncs.redis);
    const cacheKey = `tags:all:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const aiUserId = await getAiUserId();
    // 查询该用户所有未删除文章的 tags 字段
    const rows = await db
        .select({ tags: articles.tags })
        .from(articles)
        .where(and(isNull(articles.deleteAt), or(eq(articles.userId, userId), eq(articles.userId, aiUserId)), isNotNull(articles.tags)));
    
    // 把所有的数组展平并去重
    const tagSet = new Set<string>();
    rows.forEach(row => {
        if (row.tags) {
            row.tags.forEach(tag => tagSet.add(tag));
        }
    });
    
    const result = Array.from(tagSet);
    await redis.setex(cacheKey, 3600, JSON.stringify(result));
    return result;
};

/**
 * 发布文章
 * 设置 publishedAt 时间戳，使文章在公开博客首页可见
 * 
 * @param id - 目标文章 ID
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 更新后的文章记录
 */
export const publishArticleItem = async (id: string, userId: string) => {
    const aiUserId = await getAiUserId();
    const [publishedArticle] = await db
        .update(articles)
        .set({ publishedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(articles.id, id), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))))
        .returning();

    if (publishedArticle) {
        await invalidateArticleCache(publishedArticle, userId);
    }

    return publishedArticle;
};

/**
 * 取消发布文章
 * 清除 publishedAt 时间戳，将文章恢复为私有草稿
 * 同时取消置顶（草稿不应继续占据公开精选位）
 *
 * @param id - 目标文章 ID
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 更新后的文章记录
 */
export const unpublishArticleItem = async (id: string, userId: string) => {
    const aiUserId = await getAiUserId();
    const [unpublishedArticle] = await db
        .update(articles)
        .set({ publishedAt: null, isPinned: false, showOnHome: false, updatedAt: new Date() })
        .where(and(eq(articles.id, id), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))))
        .returning();

    if (unpublishedArticle) {
        await invalidateArticleCache(unpublishedArticle, userId);
    }

    return unpublishedArticle;
};

/**
 * 置顶 / 取消置顶文章
 * 置顶的已发布文章会优先出现在公开博客的精选位
 *
 * @param id - 目标文章 ID
 * @param pinned - true 置顶，false 取消置顶
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 更新后的文章记录
 */
export const pinArticleItem = async (id: string, pinned: boolean, userId: string) => {
    const aiUserId = await getAiUserId();
    const ownerScope = or(eq(articles.userId, userId), eq(articles.userId, aiUserId));
    const now = new Date();

    const { pinnedArticle, previouslyPinned } = await db.transaction(async (tx) => {
        const previouslyPinned = pinned
            ? await tx
                .select({ id: articles.id, slug: articles.slug })
                .from(articles)
                .where(and(ownerScope, eq(articles.isPinned, true)))
            : [];

        if (pinned) {
            await tx
                .update(articles)
                .set({ isPinned: false, updatedAt: now })
                .where(and(ownerScope, eq(articles.isPinned, true)));
        }

        const [pinnedArticle] = await tx
            .update(articles)
            .set({ isPinned: pinned, updatedAt: now })
            .where(and(eq(articles.id, id), ownerScope, isNotNull(articles.publishedAt)))
            .returning();

        return { pinnedArticle, previouslyPinned };
    });

    if (pinnedArticle) {
        await invalidateArticleCache(pinnedArticle, userId);
        await Promise.all(
            previouslyPinned
                .filter((item) => item.id !== pinnedArticle.id)
                .map((item) => invalidateArticleCache(item, userId)),
        );
    }

    return pinnedArticle;
};

/**
 * 设置文章是否展示在首页文章区。
 * 只有已发布文章允许展示在首页；取消发布时会自动移出首页。
 */
export const setArticleHomeVisibility = async (id: string, showOnHome: boolean, userId: string) => {
    const aiUserId = await getAiUserId();
    const conditions = [
        eq(articles.id, id),
        or(eq(articles.userId, userId), eq(articles.userId, aiUserId)),
    ];
    if (showOnHome) conditions.push(isNotNull(articles.publishedAt));

    const [updatedArticle] = await db
        .update(articles)
        .set({ showOnHome, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();

    if (updatedArticle) {
        await invalidateArticleCache(updatedArticle, userId);
    }

    return updatedArticle;
};

/**
 * 获取所有已发布的公开文章（无需鉴权）
 * 仅返回 publishedAt 非空且未删除的文章，按发布时间倒序排列
 * 
 * @returns 公开文章列表数组
 */
export const queryPublishedArticles = async () => {
    const redis = getRedisClient(serverIncs.redis);
    const cacheKey = "articles:public:list";

    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    // 单人博客：公开列表只展示站长本人的已发布文章
    const { getSiteOwnerId } = await import("../site/service");
    const ownerId = await getSiteOwnerId();
    const conditions = [isNull(articles.deleteAt), isNotNull(articles.publishedAt)];
    if (ownerId) conditions.push(eq(articles.userId, ownerId));

    const publishedList = await db
        .select()
        .from(articles)
        .where(and(...conditions))
        .orderBy(desc(articles.isPinned), desc(articles.publishedAt));

    await redis.setex(cacheKey, 3600, JSON.stringify(publishedList));
    return publishedList;
};

/**
 * 查询最新 N 篇已发布文章（首页 Latest Articles 区用）。
 * 复用公开列表（已按置顶+发布时间排序、已锁定站长），取前 limit 篇。
 *
 * @param limit - 返回篇数，默认 3
 */
export const queryLatestPublishedArticles = async (limit = 3) => {
    const list = (await queryPublishedArticles()) as (typeof articles.$inferSelect)[];
    const selected = list.filter((article) => article.showOnHome);
    const fallback = list.filter((article) => !article.showOnHome);
    return [...selected, ...fallback].slice(0, limit);
};

/**
 * 查询与指定文章相关的推荐文章（基于标签相似度，带兜底）
 *
 * 算法：用 Jaccard 相似度衡量两篇文章标签集合的接近程度
 *   相似度 = 共同标签数 / 标签并集大小（取值 0~1，越大越相关）
 * 先挑标签相关的文章按相似度降序排；若不足 limit 篇，再用「最新的其他文章」
 * 兜底补齐到 limit。这样只要站点有别的文章，推荐区块就不会空着。
 *
 * @param slugOrId - 当前文章的 slug 或 id
 * @param limit - 最多返回的推荐数量（默认 3）
 * @returns 推荐文章列表（精简字段：id/slug/title/summary/tags/publishedAt）
 */
export const queryRelatedArticles = async (slugOrId: string, limit: number = 3) => {
    // 复用公开文章列表（自带 1 小时缓存），避免额外打库
    const allPublished = (await queryPublishedArticles()) as (typeof articles.$inferSelect)[];

    // 定位当前文章
    const current = allPublished.find(
        (a) => a.slug === slugOrId || a.id === slugOrId,
    );
    if (!current) return [];

    // 除当前文章外的所有候选
    const candidates = allPublished.filter((a) => a.id !== current.id);
    if (candidates.length === 0) return [];

    const currentTags: string[] = current.tags ?? [];
    const currentSet = new Set(currentTags);

    type Article = typeof articles.$inferSelect;
    const publishedTime = (a: Article) =>
        a.publishedAt ? new Date(a.publishedAt).getTime() : 0;

    // 1) 标签相关：算 Jaccard 相似度，只保留有共同标签的，按相似度→时间降序
    const related = candidates
        .map((a) => {
            const tags = a.tags ?? [];
            if (currentTags.length === 0 || tags.length === 0) {
                return { article: a, score: 0 };
            }
            const intersection = tags.filter((t) => currentSet.has(t)).length;
            const union = new Set([...currentTags, ...tags]).size;
            const score = union === 0 ? 0 : intersection / union;
            return { article: a, score };
        })
        .filter((item) => item.score > 0)
        .sort((x, y) => {
            if (y.score !== x.score) return y.score - x.score;
            return publishedTime(y.article) - publishedTime(x.article);
        })
        .map((item) => item.article);

    // 2) 兜底：相关文章不够 limit 篇时，用「最新的其他文章」补齐
    let result = related;
    if (result.length < limit) {
        const usedIds = new Set(result.map((a) => a.id));
        const fallback = candidates
            .filter((a) => !usedIds.has(a.id)) // 不重复推荐已选中的
            .sort((x, y) => publishedTime(y) - publishedTime(x)); // 最新优先
        result = [...result, ...fallback].slice(0, limit);
    } else {
        result = result.slice(0, limit);
    }

    // 只回传卡片需要的精简字段
    return result.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        tags: a.tags,
        publishedAt: a.publishedAt,
    }));
};

/**
 * 获取 AI 机器人的内部 User ID；不存在则创建一个傀儡用户。
 *
 * 与上方只读的 getAiUserId 不同：本函数带副作用（找不到会创建），
 * 供 AI 写入类操作（如建草稿）使用，确保 AI 产生的文章有合法作者。
 *
 * @returns AI 傀儡用户的 id
 */
export const getOrCreateAiUserId = async (): Promise<string> => {
    let aiUser = await db.query.user.findFirst({
        where: eq(user.email, "ai_bot@ideaflow.local"),
    });

    if (!aiUser) {
        const [newUser] = await db
            .insert(user)
            .values({
                id: crypto.randomUUID(),
                name: "IdeaFlow AI",
                username: "ideaflow_ai",
                email: "ai_bot@ideaflow.local",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();
        aiUser = newUser;
    }

    return aiUser.id;
};

/**
 * 分块语义检索 + rerank 精排：返回与查询语义最相关的已发布文章。
 *
 * 两段式（工业级 RAG 标配）：
 *  1) 召回：在 article_chunks 上用余弦距离取 top-N 个块（N 远大于最终条数，给精排留候选）；
 *  2) 精排：用 qwen3-rerank 对 query 与候选块文本二次打分，取 top-K；
 *  3) 去重：top-K 块可能来自同一篇文章，按 articleId 去重后回填文章字段。
 *
 * @param query - 用户查询文本（既用于向量召回，也用于 rerank 打分）
 * @param limit - 最终返回的文章条数上限（默认 5）
 * @returns 精简字段的文章列表，按相关度降序
 */
export const searchPublishedArticlesByVector = async (
    query: string,
    limit: number = 5,
) => {
    const RECALL_N = 20; // 向量粗召回的块数，给 rerank 留候选空间

    const queryVector = await embedText(query);
    const distance = cosineDistance(articleChunks.embedding, queryVector);

    // 1) 召回：join 文章拿到展示字段，按块的余弦距离排序取 top-N
    const recalled = await db
        .select({
            articleId: articles.id,
            title: articles.title,
            summary: articles.summary,
            tags: articles.tags,
            slug: articles.slug,
            publishedAt: articles.publishedAt,
            chunkContent: articleChunks.content,
            similarity: sql<number>`1 - (${distance})`,
        })
        .from(articleChunks)
        .innerJoin(articles, eq(articleChunks.articleId, articles.id))
        .where(
            and(
                isNull(articles.deleteAt),
                isNotNull(articles.publishedAt),
                isNotNull(articleChunks.embedding),
            ),
        )
        .orderBy(distance)
        .limit(RECALL_N);

    if (recalled.length === 0) return [];

    // 2) 精排：按 query 与块原文的相关性重排（失败自动降级为召回顺序）
    const reranked = await rerankByRelevance(
        query,
        recalled,
        (r) => r.chunkContent,
        RECALL_N, // 先全量重排，去重后再截到 limit
    );

    // 3) 去重：同一篇文章可能命中多个块，保留最高排名的那条；截到 limit 篇
    const seen = new Set<string>();
    const articlesOut: Array<{
        title: string;
        summary: string | null;
        tags: unknown;
        slug: string | null;
        publishedAt: Date | null;
        similarity: number;
    }> = [];
    for (const r of reranked) {
        if (seen.has(r.articleId)) continue;
        seen.add(r.articleId);
        articlesOut.push({
            title: r.title,
            summary: r.summary,
            tags: r.tags,
            slug: r.slug,
            publishedAt: r.publishedAt,
            similarity: r.similarity,
        });
        if (articlesOut.length >= limit) break;
    }
    return articlesOut;
};

/**
 * 为指定文章生成并写回分块向量（增量更新用）。
 *
 * 供后台队列在文章创建/发布/摘要更新后异步调用，使新内容可被语义检索。
 * 把文章切成多个语义块（chunkArticle），逐块向量化后写入 article_chunks。
 * 幂等：先删该文章已有的块，再重新生成，避免重复或残留。
 *
 * @param articleId - 目标文章 ID
 */
export const generateArticleEmbedding = async (articleId: string) => {
    const [article] = await db
        .select()
        .from(articles)
        .where(eq(articles.id, articleId));
    if (!article || !article.content) return;

    const chunks = chunkArticle(article);
    if (chunks.length === 0) return;

    // 幂等：先清掉旧块，再写新块
    await db.delete(articleChunks).where(eq(articleChunks.articleId, articleId));

    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
        const vector = await embedText(chunks[i]);
        rows.push({
            articleId,
            chunkIndex: i,
            content: chunks[i],
            embedding: vector,
        });
    }
    await db.insert(articleChunks).values(rows);
};

