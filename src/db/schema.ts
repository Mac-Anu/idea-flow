import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const articles = pgTable("articles", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).unique(), // 新增的别名（短链接）字段，必须唯一
    title: text("title").notNull(),
    content: text("content").default("").notNull(),
    imageUrl: text("image_url"),
    tags: text("tags").array(),
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
