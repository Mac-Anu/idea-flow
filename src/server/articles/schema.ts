import { z } from "zod";

export const ArticleSchema = z.object({
    id: z.string().min(1, "ID不能为空").meta({ description: "文章的唯一ID" }),
    title: z.string().meta({ description: "文章标题" }),
    content: z.string().meta({ description: "文章正文内容" }),
    slug: z.string().nullable().optional().meta({ description: "短链接别名" }),
    imageUrl: z.string().nullable().optional().meta({ description: "文章封面图片URL" }),
    tags: z.array(z.string()).nullable().optional().meta({ description: "文章标签数组" }),
    createdAt: z.string().meta({ description: "文章创建时间" }),
    updatedAt: z.string().meta({ description: "文章更新时间" }),
    deleteAt: z.string().nullable().meta({ description: "文章删除时间" }),
});

export const createArticleSchema = z
    .object({
        id: z.string().uuid().optional().meta({ description: "客户端预生成的 UUID（可选，用于乐观导航）" }),
        title: z.string().meta({ description: "文章标题" }),
        content: z.string().meta({ description: "文章正文内容" }),
        slug: z.string().optional().meta({ description: "短链接别名(slug)" }),
        tags: z.array(z.string()).optional().meta({ description: "文章标签" }),
    })
    .meta({ description: "新建文章的请求参数格式" });

export const updateArticleSchema = z
    .object({
        id: z.string().min(1, "ID不能为空").meta({ description: "被修改文章的唯一ID" }),
        title: z.string().meta({ description: "修改后的新标题" }),
        content: z.string().meta({ description: "修改后的新内容" }),
        slug: z.string().optional().meta({ description: "修改后的短链接别名(slug)" }),
        tags: z.array(z.string()).optional().meta({ description: "修改后的标签" }),
    })
    .meta({ description: "修改文章的请求参数格式" });

export const aiAssistantSchema = z
    .object({
        prompt: z.string().min(1, "提示词不能为空").meta({ description: "发送给AI助手的问题或内容" }),
    })
    .meta({ description: "调用AI助手的请求参数格式" });

export const aiAssistantResponseSchema = z
    .object({
        response: z.string().meta({ description: "最终生成的完美回答" }),
        history: z.array(z.any()).optional().meta({ description: "完整的反思审查对话历史链" }),
    })
    .meta({ description: "AI助手返回的响应数据格式" });
