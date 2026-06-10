import { isNil } from "lodash";
import pinyin from "pinyin";
import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { eq, or, isNull, desc, isNotNull, ilike, and } from "drizzle-orm";
import { CreateArticleInput, UpdateArticleInput } from "./type";
import { searchArticlesWithMeili } from "./search/service";
import { addSearchSyncJob, addSearchDeleteJob, addAiSummaryJob } from "./queue";
import { getRedisClient } from "@/lib/redis";
import { serverIncs } from "../common/app";

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
        .set({ publishedAt: null, isPinned: false, updatedAt: new Date() })
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
    const [pinnedArticle] = await db
        .update(articles)
        .set({ isPinned: pinned, updatedAt: new Date() })
        .where(and(eq(articles.id, id), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))))
        .returning();

    if (pinnedArticle) {
        await invalidateArticleCache(pinnedArticle, userId);
    }

    return pinnedArticle;
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

    const publishedList = await db
        .select()
        .from(articles)
        .where(and(isNull(articles.deleteAt), isNotNull(articles.publishedAt)))
        .orderBy(desc(articles.isPinned), desc(articles.publishedAt));
        
    await redis.setex(cacheKey, 3600, JSON.stringify(publishedList));
    return publishedList;
};

