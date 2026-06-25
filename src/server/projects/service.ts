import { isNil } from "lodash";
import pinyin from "pinyin";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, or, desc, and, isNotNull } from "drizzle-orm";
import { CreateProjectInput, UpdateProjectInput } from "./type";

/**
 * 判断字符串是否为合法的 UUID 格式
 * 用于区分传入的标识是项目 ID(UUID) 还是 slug(别名)
 */
const isUuid = (value: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/**
 * 根据标题自动生成唯一的 Slug (URL 别名)
 * 转换汉字为拼音，过滤特殊字符，自动去重。与文章 slug 逻辑一致。
 *
 * @param title - 项目标题
 * @returns 唯一的 slug 字符串
 */
export const generateUniqueSlug = async (title: string): Promise<string> => {
    const pyList = pinyin(title, { style: "normal" });

    let baseSlug = pyList
        .map((item) => item[0])
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9\-]+/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 200)
        .replace(/-$/, "");

    if (!baseSlug) {
        baseSlug = "project";
    }

    let slug = baseSlug;
    let count = 0;
    while (true) {
        const [existing] = await db.select().from(projects).where(eq(projects.slug, slug));
        if (!existing) break;
        count++;
        slug = `${baseSlug}-${count}`;
    }

    return slug;
};

/**
 * 获取当前用户的项目列表(后台管理用)
 * 按排序权重降序、更新时间降序排列
 *
 * @param userId - 目标用户 ID
 */
export const queryProjectList = async (userId: string) => {
    return db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.sortOrder), desc(projects.updatedAt));
};

/**
 * 获取所有公开项目列表(公开展示页用，无需登录)
 * 单人博客：只展示站长本人的已发布项目；置顶优先，再按发布时间倒序
 */
export const queryPublicProjects = async () => {
    const { getSiteOwnerId } = await import("../site/service");
    const ownerId = await getSiteOwnerId();

    const conditions = [isNotNull(projects.publishedAt)];
    if (ownerId) conditions.push(eq(projects.userId, ownerId));

    return db
        .select()
        .from(projects)
        .where(and(...conditions))
        .orderBy(desc(projects.isPinned), desc(projects.publishedAt));
};

/**
 * 查询前 N 个公开项目（首页"What I've been working on"区用）。
 * 复用公开列表（已锁定站长、已按置顶+发布时间排序），取前 limit 个。
 *
 * @param limit - 返回个数，默认 3
 */
export const queryLatestPublicProjects = async (limit = 3) => {
    const list = await queryPublicProjects();
    const selected = list.filter((project) => project.showOnHome);
    const fallback = list.filter((project) => !project.showOnHome);
    return [...selected, ...fallback].slice(0, limit);
};

/**
 * 复合查询单个项目：可传 UUID 或 slug
 *
 * @param arg - 项目的 UUID 或别名 (slug)
 * @returns 匹配的项目实体，未找到返回 null
 */
export const queryProjectItem = async (arg: string) => {
    const condition = isUuid(arg)
        ? or(eq(projects.id, arg), eq(projects.slug, arg))
        : eq(projects.slug, arg);

    const [item] = await db.select().from(projects).where(condition);
    return isNil(item) ? null : item;
};

/**
 * 根据 ID 查询单个项目(鉴权用，返回含 userId 的原始记录)
 *
 * @param id - 项目 UUID
 */
export const queryProjectId = async (id: string) => {
    if (!isUuid(id)) return null;
    const [item] = await db.select().from(projects).where(eq(projects.id, id));
    return isNil(item) ? null : item;
};

/**
 * 创建新项目，自动生成 slug 并绑定当前用户
 *
 * @param data - 项目创建负载
 * @param userId - 当前操作用户 ID
 */
export const createProjectItem = async (data: CreateProjectInput, userId: string) => {
    const slug = data.slug || (await generateUniqueSlug(data.title));

    // published 是布尔开关，转成 publishedAt 时间戳列（非表字段，需剥离）
    const { published, ...rest } = data;
    const publishedAt = published ? new Date() : undefined;
    const showOnHome = published ? rest.showOnHome : false;

    const [created] = await db
        .insert(projects)
        .values({ ...rest, showOnHome, slug, userId, ...(publishedAt ? { publishedAt } : {}) })
        .returning();

    return created;
};

/**
 * 更新项目信息，仅允许原作者操作
 *
 * @param id - 目标项目 ID
 * @param data - 增量更新负载
 * @param userId - 当前操作用户 ID(鉴权用)
 */
export const updateProjectItem = async (id: string, data: UpdateProjectInput, userId: string) => {
    // published 布尔开关 → publishedAt 列：true 设当前时间，false 清空转草稿
    const { published, ...rest } = data;
    const publishedPatch =
        published === undefined ? {} : { publishedAt: published ? new Date() : null };
    const showOnHomePatch =
        published === false ? { showOnHome: false } : {};

    const [updated] = await db
        .update(projects)
        .set({ ...rest, ...publishedPatch, ...showOnHomePatch, updatedAt: new Date() })
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();

    return updated;
};

/**
 * 删除项目(物理删除)，仅允许原作者操作
 *
 * @param id - 目标项目 ID
 * @param userId - 当前操作用户 ID(鉴权用)
 */
export const deleteProjectItem = async (id: string, userId: string) => {
    const [deleted] = await db
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();

    return deleted;
};

/**
 * 关键词检索公开项目(供 AI 工具使用)
 * 项目量少，直接全量取出后在内存里按标题/简介/技术栈做不区分大小写的字面匹配。
 * 关键词为空则返回全部。
 *
 * @param keyword - 检索关键词
 * @param limit - 返回条数上限
 */
export const searchPublicProjects = async (keyword: string, limit = 10) => {
    const all = await queryPublicProjects();
    const kw = keyword.trim().toLowerCase();
    if (!kw) return all.slice(0, limit);

    const matched = all.filter((p) => {
        const haystack = [
            p.title,
            p.description,
            ...(p.techStack ?? []),
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(kw);
    });

    return matched.slice(0, limit);
};
