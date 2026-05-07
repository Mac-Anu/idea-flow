import { isNil } from "lodash";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq, or, isNull, desc, isNotNull, ilike, and } from "drizzle-orm";
import { CreateArticleInput, UpdateArticleInput } from "./type";
import { syncArticleSearchDocument, deleteArticleSearchDocument, searchArticlesWithMeili } from "./search/service";

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
 * 创建新文章
 * 支持指定 ID 创建或自动生成 ID，会自动绑定当前用户
 * 
 * @param data - 文章创建负载数据 (CreateArticleInput)
 * @param userId - 当前操作用户的 ID
 * @returns 创建成功的文章记录
 */
export const createArticleItem = async (data: CreateArticleInput, userId: string) => {
    const insertData = data.id
        ? { ...data, userId }
        : { title: data.title, content: data.content, slug: data.slug, tags: data.tags, userId };
    const [createArticle] = await db
        .insert(articles)
        .values(insertData)
        .returning();
    
    // 触发搜索引擎同步
    if (createArticle) {
        await syncArticleSearchDocument(createArticle.id);
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
    const [updateArticle] = await db
        .update(articles)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
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
    const [deleteArticle] = await db
        .update(articles)
        .set({ deleteAt: new Date() })
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
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
    const articleList = await db
        .select()
        .from(articles)
        .where(and(isNull(articles.deleteAt), eq(articles.userId, userId)))
        .orderBy(desc(articles.updatedAt));
    return articleList;
};

/**
 * 获取当前用户的回收站文章列表
 * 即已被软删除 (deleteAt 不为空) 的记录
 * 
 * @param userId - 目标用户 ID
 * @returns 处于回收站状态的文章列表数组
 */
export const queryArticleTrashList = async (userId: string) => {
    const trashList = await db
        .select()
        .from(articles)
        .where(and(isNotNull(articles.deleteAt), eq(articles.userId, userId)));
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
    const restoreArticle = await db
        .update(articles)
        .set({ deleteAt: null })
        .where(and(eq(articles.id, id), eq(articles.userId, userId)));
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
    // 查询该用户所有未删除文章的 tags 字段
    const rows = await db
        .select({ tags: articles.tags })
        .from(articles)
        .where(and(isNull(articles.deleteAt), eq(articles.userId, userId), isNotNull(articles.tags)));
    
    // 把所有的数组展平并去重
    const tagSet = new Set<string>();
    rows.forEach(row => {
        if (row.tags) {
            row.tags.forEach(tag => tagSet.add(tag));
        }
    });
    return Array.from(tagSet);
};
