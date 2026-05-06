import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { TagMutation } from "./type";

export const queryTagItem = async (item: string, userId: string) => {
    const [result] = await db
        .select()
        .from(tags)
        .where(
            and(
                or(eq(tags.id, item), eq(tags.text, decodeURIComponent(item))),
                eq(tags.userId, userId)
            )
        );
    return result || null;
};

export const queryTagList = async (userId: string) => {
    return await db.select().from(tags).where(eq(tags.userId, userId));
};

export const createTagItem = async (data: TagMutation, userId: string) => {
    const [result] = await db
        .insert(tags)
        .values({
            text: data.text,
            userId,
        })
        .returning();
    return result;
};

export const updateTagItem = async (id: string, data: TagMutation, userId: string) => {
    const item = await queryTagItem(id, userId);
    if (!item) return null;
    
    const [result] = await db
        .update(tags)
        .set({ text: data.text, updatedAt: new Date() })
        .where(and(eq(tags.id, item.id), eq(tags.userId, userId)))
        .returning();
    return result;
};

export const deleteTagItem = async (id: string, userId: string) => {
    const item = await queryTagItem(id, userId);
    if (!item) return null;
    
    const [result] = await db
        .delete(tags)
        .where(and(eq(tags.id, item.id), eq(tags.userId, userId)))
        .returning();
    return result;
};
