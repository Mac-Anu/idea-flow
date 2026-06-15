import { pgTable, text, timestamp, uuid, varchar, boolean, vector, integer } from "drizzle-orm/pg-core";
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

export const tags = pgTable("tags", {
    id: uuid("id").primaryKey().defaultRandom(),
    text: varchar("text", { length: 255 }).notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export * from "./auth-schema";
export * from "./rbac-schema";
