import { pgTable, text, timestamp, uuid, varchar, boolean, vector } from "drizzle-orm/pg-core";
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
