import { isNil } from "lodash";
import pinyin from "pinyin";
import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { eq, or, isNull, desc, isNotNull, ilike, and } from "drizzle-orm";
import { CreateArticleInput, UpdateArticleInput } from "./type";
import { syncArticleSearchDocument, deleteArticleSearchDocument, searchArticlesWithMeili } from "./search/service";

const getAiUserId = async () => {
    const aiUser = await db.query.user.findFirst({
        where: eq(user.email, "ai_bot@ideaflow.local")
    });
    return aiUser?.id || "NO_AI_USER";
};

/**
 * 复合查询单篇文章
 * 尝试通过文章 ID 或 Slug 进行精确匹配
 * 
 * @param arg - 文章的 UUID 或别名 (slug)
 * @returns 匹配的文章实体，若未找到则返回 null
 */
export const queryArticleItem = async (arg: string) => {
    const [item] = await db
        .select()
        .from(articles)
        .where(or(eq(articles.id, arg), eq(articles.slug, arg)));
    if (isNil(item)) {
        return null;
    }
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
    
    // 触发搜索引擎同步 (加入 try-catch 防止搜索服务宕机导致文章无法保存)
    if (createArticle) {
        try {
            await syncArticleSearchDocument(createArticle.id);
        } catch (e) {
            console.warn(`[Search Sync Warning] 未能同步文章 ${createArticle.id} 到搜索引擎:`, e);
        }
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
    const [updateArticle] = await db
        .update(articles)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(articles.id, id), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))))
        .returning();
    
    // 触发搜索引擎同步
    if (updateArticle) {
        await syncArticleSearchDocument(updateArticle.id);
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
    
    // 从搜索引擎彻底移除软删除的文章
    if (deleteArticle) {
        await deleteArticleSearchDocument(deleteArticle.id);
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
    return Array.from(tagSet);
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
    return publishedArticle;
};

/**
 * 取消发布文章
 * 清除 publishedAt 时间戳，将文章恢复为私有草稿
 * 
 * @param id - 目标文章 ID
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 更新后的文章记录
 */
export const unpublishArticleItem = async (id: string, userId: string) => {
    const aiUserId = await getAiUserId();
    const [unpublishedArticle] = await db
        .update(articles)
        .set({ publishedAt: null, updatedAt: new Date() })
        .where(and(eq(articles.id, id), or(eq(articles.userId, userId), eq(articles.userId, aiUserId))))
        .returning();
    return unpublishedArticle;
};

/**
 * 获取所有已发布的公开文章（无需鉴权）
 * 仅返回 publishedAt 非空且未删除的文章，按发布时间倒序排列
 * 
 * @returns 公开文章列表数组
 */
export const queryPublishedArticles = async () => {
    const publishedList = await db
        .select()
        .from(articles)
        .where(and(isNull(articles.deleteAt), isNotNull(articles.publishedAt)))
        .orderBy(desc(articles.publishedAt));
    return publishedList;
};

