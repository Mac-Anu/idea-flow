import { tool } from "@langchain/core/tools";
import { z } from "zod";
import crypto from "crypto";
import { queryPublishedArticles, createArticleItem } from "../articles/service";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Article } from "../articles/type";

/**
 * 检索已发布文章的工具
 */
export const searchPublishedArticlesTool = tool(
    async ({ keyword }) => {
        try {
            const articles = await queryPublishedArticles();
            if (!articles || articles.length === 0) {
                return "未找到任何文章。";
            }
            
            // 简单的内存搜索过滤 (实际项目中会用向量数据库或 Meilisearch)
            const lowerKeyword = keyword.toLowerCase();
            const matched = articles.filter((a: Article) => 
                a.title.toLowerCase().includes(lowerKeyword) || 
                (a.summary && a.summary.toLowerCase().includes(lowerKeyword)) ||
                (a.tags && Array.isArray(a.tags) && a.tags.some((t: string) => t.toLowerCase().includes(lowerKeyword)))
            );
            
            if (matched.length === 0) {
                return `未找到与 "${keyword}" 相关的文章，但知识库中共有 ${articles.length} 篇文章。`;
            }
            
            // 格式化输出供大模型读取
            return matched.map((a: Article) => `标题: ${a.title}\n描述: ${a.summary || '无'}\n标签: ${(a.tags as string[])?.join(', ')}\n发布于: ${a.publishedAt}\n链接: /article/${a.slug}`).join("\n\n---\n\n");
        } catch (e: any) {
            return `搜索出错: ${e.message}`;
        }
    },
    {
        name: "search_published_articles",
        description: "搜索博客系统中已经发布的公开文章，可用于回答用户关于博客内容的问题。",
        schema: z.object({
            keyword: z.string().describe("搜索关键词，例如 'React', '性能优化' 等"),
        }),
    }
);

/**
 * 获取 AI 机器人的内部 User ID，用于将其作为新建文章的默认拥有者
 */
const getAiUserId = async () => {
    let aiUser = await db.query.user.findFirst({
        where: eq(user.email, "ai_bot@ideaflow.local")
    });
    
    // 如果没有，则创建一个傀儡用户
    if (!aiUser) {
        const [newUser] = await db.insert(user).values({
            id: crypto.randomUUID(),
            name: "IdeaFlow AI",
            username: "ideaflow_ai",
            email: "ai_bot@ideaflow.local",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        aiUser = newUser;
    }
    
    return aiUser.id;
};

/**
 * 创建新草稿工具
 */
export const createIdeaDraftTool = tool(
    async ({ title, content, tags }) => {
        try {
            const aiUserId = await getAiUserId();
            
            const article = await createArticleItem({
                title,
                content,
                tags,
                summary: content.substring(0, 100) + "...",
            }, aiUserId);
            
            return `成功创建草稿！\n标题: ${article.title}\n文章ID: ${article.id}\n链接: /dashboard/idea/${article.id}`;
        } catch (e: any) {
            return `创建草稿失败: ${e.message}`;
        }
    },
    {
        name: "create_idea_draft",
        description: "当用户提出一个新想法、或者要求你记录一个笔记时，使用此工具将其保存为系统中的文章草稿(Draft)。",
        schema: z.object({
            title: z.string().describe("根据用户想法提炼的文章标题"),
            content: z.string().describe("文章详细正文(Markdown 格式)"),
            tags: z.array(z.string()).describe("分类标签列表，不超过3个"),
        }),
    }
);

export const tools = [searchPublishedArticlesTool, createIdeaDraftTool];
