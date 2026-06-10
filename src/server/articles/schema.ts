import { z } from "zod";

export const ArticleSchema = z.object({
    id: z.string().min(1, "ID不能为空").meta({ description: "文章的唯一ID" }),
    title: z.string().meta({ description: "文章标题" }),
    content: z.string().meta({ description: "文章正文内容" }),
    summary: z.string().nullable().optional().meta({ description: "AI 总结内容 (TL;DR)" }),
    slug: z.string().nullable().optional().meta({ description: "短链接别名" }),
    imageUrl: z.string().nullable().optional().meta({ description: "文章封面图片URL" }),
    tags: z.array(z.string()).nullable().optional().meta({ description: "文章标签数组" }),
    publishedAt: z.string().nullable().optional().meta({ description: "文章发布时间，null 表示草稿" }),
    isPinned: z.boolean().optional().meta({ description: "是否置顶" }),
    createdAt: z.string().meta({ description: "文章创建时间" }),
    updatedAt: z.string().meta({ description: "文章更新时间" }),
    deleteAt: z.string().nullable().meta({ description: "文章删除时间" }),
    isAIGenerated: z.boolean().optional().meta({ description: "是否由 AI 抓取生成" }),
    userId: z.string().optional().meta({ description: "文章所属作者ID" }),
});

export const createArticleSchema = z
    .object({
        id: z.string().uuid().optional().meta({ description: "客户端预生成的 UUID（可选，用于乐观导航）" }),
        title: z.string().meta({ description: "文章标题" }),
        content: z.string().meta({ description: "文章正文内容" }),
        summary: z.string().optional().meta({ description: "AI 总结内容" }),
        slug: z.string().optional().meta({ description: "短链接别名(slug)" }),
        tags: z.array(z.string()).optional().meta({ description: "文章标签" }),
    })
    .meta({ description: "新建文章的请求参数格式" });

export const updateArticleSchema = z
    .object({
        id: z.string().min(1, "ID不能为空").meta({ description: "被修改文章的唯一ID" }),
        title: z.string().meta({ description: "修改后的新标题" }),
        content: z.string().meta({ description: "修改后的新内容" }),
        summary: z.string().optional().meta({ description: "修改后的AI 总结内容" }),
        slug: z.string().optional().meta({ description: "修改后的短链接别名(slug)" }),
        tags: z.array(z.string()).optional().meta({ description: "修改后的标签" }),
    })
    .meta({ description: "修改文章的请求参数格式" });

export const publishArticleSchema = z
    .object({
        published: z.boolean().meta({ description: "true 为发布，false 为取消发布" }),
    })
    .meta({ description: "发布/取消发布文章的请求参数格式" });

export const pinArticleSchema = z
    .object({
        pinned: z.boolean().meta({ description: "true 为置顶，false 为取消置顶" }),
    })
    .meta({ description: "置顶/取消置顶文章的请求参数格式" });

