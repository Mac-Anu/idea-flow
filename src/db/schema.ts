import { pgTable, text, timestamp, uuid, varchar, boolean, vector, integer, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const articles = pgTable("articles", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).unique(), // 新增的别名（短链接）字段，必须唯一
    title: text("title").notNull(),
    content: text("content").default("").notNull(),
    summary: text("summary"), // AI 总结字段 (TL;DR)
    imageUrl: text("image_url"),
    tags: text("tags").array(),
    // 文章语义向量（通义 text-embedding-v4，1024 维）。可空：存量文章尚未回填，新发布时异步写入。
    embedding: vector("embedding", { dimensions: 1024 }),
    publishedAt: timestamp("published_at"),
    isPinned: boolean("is_pinned").default(false).notNull(), // 是否置顶（精选位优先展示）
    showOnHome: boolean("show_on_home").default(false).notNull(), // 是否展示在首页文章区
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deleteAt: timestamp("deleted_at"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

// 文章分块表：一篇文章切成多个语义块，每块单独向量化，用于分块 RAG 检索。
// 与 articles.embedding（整篇一个向量）并存，检索走本表，旧列保留向后兼容。
export const articleChunks = pgTable("article_chunks", {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
        .notNull()
        .references(() => articles.id, { onDelete: "cascade" }),
    // 同一篇文章内的块序号（从 0 递增），便于排序与排查
    chunkIndex: integer("chunk_index").notNull(),
    // 该块原文：rerank 精排和喂给 LLM 都用它
    content: text("content").notNull(),
    // 该块语义向量（通义 text-embedding-v4，1024 维）
    embedding: vector("embedding", { dimensions: 1024 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 项目作品表：展示个人项目（封面、技术栈、链接），独立于文章系统。
// 用结构化字段而非富文本，详情页直接渲染字段；不做软删除（作品量少，直接物理删）。
export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).unique(), // 详情页 URL 别名（标题转拼音生成）
    title: text("title").notNull(),
    description: text("description").default("").notNull(), // 项目简介（详情页正文）
    imageUrl: text("image_url"), // 封面/首页缩略图，复用 /api/upload
    gallery: text("gallery").array(), // 项目图集：额外的多张展示图 URL，详情页画廊展示
    techStack: text("tech_stack").array(), // 技术栈名称数组，如 ["TypeScript","Next.js"]
    liveUrl: text("live_url"), // 线上 Demo 地址
    githubUrl: text("github_url"), // 源码仓库地址
    featured: boolean("featured").default(false).notNull(), // 是否精选（卡片角标）
    sortOrder: integer("sort_order").default(0).notNull(), // 手动排序权重（大的靠前）
    // 发布时间：null = 未发布草稿，公开页只展示已发布项目，排序用。与 articles.publishedAt 语义一致。
    publishedAt: timestamp("published_at"),
    isPinned: boolean("is_pinned").default(false).notNull(), // 是否置顶（公开列表优先展示）
    showOnHome: boolean("show_on_home").default(false).notNull(), // 是否展示在首页项目区
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const tags = pgTable("tags", {
    id: uuid("id").primaryKey().defaultRandom(),
    text: varchar("text", { length: 255 }).notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 站点 Profile：单行配置，存公开站的版头/头像/社媒等。后台可编辑，公开页读取。
// 一个站长一行（按 userId 唯一），首行即生效。
export const siteProfile = pgTable("site_profile", {
    id: uuid("id").primaryKey().defaultRandom(),
    headline: text("headline").default("").notNull(), // 版头大标题，如 "Hi, I'm Mac-Anu 👋"
    intro: text("intro").default("").notNull(), // 版头自我介绍段落
    bannerImage: text("banner_image"), // 版头背景图（可选）
    avatar: text("avatar"), // 站长头像（侧边栏/关于页降级用）
    name: text("name").default("").notNull(), // 展示名
    title: text("title").default("").notNull(), // 一句话头衔
    bio: text("bio").default("").notNull(), // 侧边栏简短 bio
    // 社媒数组：[{ label, href, iconKey }]，iconKey 对应前端图标映射
    socials: jsonb("socials").$type<{ label: string; href: string; iconKey: string }[]>(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export * from "./auth-schema";
export * from "./rbac-schema";
