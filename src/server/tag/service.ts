import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { TagMutation } from "./type";

/**
 * 复合查询单条标签
 * 尝试通过标签 ID 或 标签明文 (文本) 进行精确匹配
 * 
 * @param item - 标签的 UUID 或 明文 (会对 URI 编码进行解码)
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 匹配的标签实体，若未找到则返回 null
 */
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

/**
 * 获取当前用户拥有的所有标签列表
 * 
 * @param userId - 目标用户 ID
 * @returns 用户的独立标签列表数组
 */
export const queryTagList = async (userId: string) => {
    return await db.select().from(tags).where(eq(tags.userId, userId));
};

/**
 * 创建新标签
 * 
 * @param data - 标签创建负载数据 (包含标签文本 text)
 * @param userId - 当前操作用户的 ID
 * @returns 创建成功的标签记录
 */
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

/**
 * 更新现有标签文本
 * 自动拦截越权访问，确保只能修改自己的标签
 * 
 * @param id - 目标标签 ID
 * @param data - 增量更新负载数据
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 更新后的标签记录，若不存在返回 null
 */
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

/**
 * 彻底删除标签 (物理删除)
 * 自动拦截越权访问，确保只能删除自己的标签
 * 
 * @param id - 目标标签 ID
 * @param userId - 当前操作用户的 ID (鉴权用)
 * @returns 被删除的标签记录，若不存在返回 null
 */
export const deleteTagItem = async (id: string, userId: string) => {
    const item = await queryTagItem(id, userId);
    if (!item) return null;
    
    const [result] = await db
        .delete(tags)
        .where(and(eq(tags.id, item.id), eq(tags.userId, userId)))
        .returning();
    return result;
};
