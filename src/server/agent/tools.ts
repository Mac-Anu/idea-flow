import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
    createArticleItem,
    getOrCreateAiUserId,
    searchPublishedArticlesByVector,
} from "../articles/service";

/**
 * 检索已发布文章的工具（分块语义检索 + rerank 精排）
 *
 * 旧版用 String.includes 做字面子串匹配，只能命中完全重合的词，语义相近但用词不同的
 * （如「前端性能」vs「网页提速」）会漏召回。现改为：关键词在 article_chunks 上做向量
 * 粗召回，再用 qwen3-rerank 二次精排取最相关的若干篇，比的是语义而非字面。
 */
export const searchPublishedArticlesTool = tool(
    async ({ keyword }) => {
        try {
            // 向量粗召回 + rerank 精排 + 按文章去重，取最相关的 5 篇（细节在 service 层）
            const matched = await searchPublishedArticlesByVector(keyword, 5);

            if (matched.length === 0) {
                return "知识库中暂无可检索的文章。";
            }

            // 格式化输出供大模型读取
            return matched
                .map(
                    (a) =>
                        `标题: ${a.title}\n描述: ${a.summary || "无"}\n标签: ${(a.tags as string[])?.join(", ")}\n发布于: ${a.publishedAt}\n链接: /article/${a.slug}`,
                )
                .join("\n\n---\n\n");
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            return `搜索出错: ${message}`;
        }
    },
    {
        name: "search_published_articles",
        description: "搜索博客系统中已经发布的公开文章，可用于回答用户关于博客内容的问题。",
        schema: z.object({
            keyword: z.string().describe("搜索关键词，例如 'React', '性能优化' 等"),
        }),
    },
);

/**
 * 创建新草稿工具
 */
export const createIdeaDraftTool = tool(
    async ({ title, content, tags }) => {
        try {
            const aiUserId = await getOrCreateAiUserId();

            const article = await createArticleItem(
                {
                    title,
                    content,
                    tags,
                    summary: content.substring(0, 100) + "...",
                },
                aiUserId,
            );

            return `成功创建草稿！\n标题: ${article.title}\n文章ID: ${article.id}\n链接: /dashboard/idea/${article.id}`;
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            return `创建草稿失败: ${message}`;
        }
    },
    {
        name: "create_idea_draft",
        description:
            "当用户提出一个新想法、或者要求你记录一个笔记时，使用此工具将其保存为系统中的文章草稿(Draft)。",
        schema: z.object({
            title: z.string().describe("根据用户想法提炼的文章标题"),
            content: z.string().describe("文章详细正文(Markdown 格式)"),
            tags: z.array(z.string()).describe("分类标签列表，不超过3个"),
        }),
    },
);

export const tools = [searchPublishedArticlesTool, createIdeaDraftTool];
