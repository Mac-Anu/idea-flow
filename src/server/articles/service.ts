import { isNil } from "lodash";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq, or, isNull, desc, isNotNull, ilike, and } from "drizzle-orm";
import { CreateArticleInput, UpdateArticleInput } from "./type";

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

export const queryArticleId = async (id: string) => {
    const [item] = await db.select().from(articles).where(eq(articles.id, id));
    if (isNil(item)) {
        return null;
    }
    return item;
};

export const queryArticleSlug = async (slug: string) => {
    const [item] = await db.select().from(articles).where(eq(articles.slug, slug));
    if (isNil(item)) {
        return null;
    }
    return item;
};

export const createArticleItem = async (data: CreateArticleInput, userId: string) => {
    const insertData = data.id
        ? { ...data, userId }
        : { title: data.title, content: data.content, slug: data.slug, userId };
    const [createArticle] = await db
        .insert(articles)
        .values(insertData)
        .returning();
    return createArticle;
};

export const updateArticleItem = async (id: string, data: UpdateArticleInput, userId: string) => {
    const [updateArticle] = await db
        .update(articles)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
        .returning();
    return updateArticle;
};

export const deleteArticleItem = async (id: string, userId: string) => {
    const [deleteArticle] = await db
        .update(articles)
        .set({ deleteAt: new Date() })
        .where(and(eq(articles.id, id), eq(articles.userId, userId)))
        .returning();
    return deleteArticle;
};

export const queryArticleList = async (userId: string) => {
    const articleList = await db
        .select()
        .from(articles)
        .where(and(isNull(articles.deleteAt), eq(articles.userId, userId)))
        .orderBy(desc(articles.updatedAt));
    return articleList;
};

export const queryArticleTrashList = async (userId: string) => {
    const trashList = await db
        .select()
        .from(articles)
        .where(and(isNotNull(articles.deleteAt), eq(articles.userId, userId)));
    return trashList;
};

export const restoreArticleItem = async (id: string, userId: string) => {
    const restoreArticle = await db
        .update(articles)
        .set({ deleteAt: null })
        .where(and(eq(articles.id, id), eq(articles.userId, userId)));
    return restoreArticle;
};

export const searchArticles = async (query: string, titleOnly: boolean = false, userId: string) => {
    const searchResults = await db
        .select()
        .from(articles)
        .where(
            and(
                isNull(articles.deleteAt),
                titleOnly
                    ? ilike(articles.title, `%${query}%`)
                    : or(
                          ilike(articles.title, `%${query}%`),
                          ilike(articles.content, `%${query}%`),
                      ),
                eq(articles.userId, userId),
            ),
        );
    return searchResults;
};
