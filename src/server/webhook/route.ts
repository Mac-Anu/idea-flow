import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createArticleItem } from "../articles/service";
import { createErrorResult } from "../common/error";
import { describeRoute } from "hono-openapi";

export const webhookApi = new Hono();

const N8nWebhookSchema = z.object({
    title: z.string().min(1, "标题不能为空"),
    content: z.string().min(1, "正文不能为空"),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional().default(["n8n", "AI翻译"]),
});

webhookApi.post(
    "/n8n/article",
    describeRoute({
        tags: ["Webhook"],
        summary: "接收 n8n 抓取的文章",
        description: "供 n8n 自动化流水线调用的接口，需在 Header 携带 Authorization Token",
        responses: {
            200: {
                description: "成功",
            },
            401: {
                description: "鉴权失败",
            },
        },
    }),
    zValidator("json", N8nWebhookSchema),
    async (c) => {
        try {
            // 1. 验证 Token (防止恶意调用)
            const authHeader = c.req.header("Authorization");
            const secretToken = process.env.N8N_SECRET_TOKEN;
            
            if (!secretToken || authHeader !== `Bearer ${secretToken}`) {
                return c.json(createErrorResult("未授权：Token 无效或未配置", null, 401), 401);
            }

            // 2. 获取传递过来的文章数据
            let { title, content, summary, tags } = c.req.valid("json");

            // 提取 Markdown 中的真实标题
            const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let titleFound = false;
            
            // 策略 1：只在前 5 行寻找带 # 的大标题，防止误抓正文中间的段落小标题
            for (let i = 0; i < Math.min(lines.length, 5); i++) {
                const match = lines[i].match(/^#{1,2}\s+(.+)$/);
                if (match && match[1]) {
                    // 去除可能带有的 Markdown 链接后缀 [](http...)
                    title = match[1].replace(/\[\]\(.*?\)/g, '').trim();
                    content = content.replace(lines[i], ''); // 从正文中剔除
                    titleFound = true;
                    break;
                }
            }

            // 策略 2：兜底策略，如果没有 # 标题，抓第一行真正的文字
            if (!titleFound) {
                const textLines = lines.filter(l => !l.startsWith('>') && !l.startsWith('|'));
                if (textLines.length > 0) {
                    // 去除前后奇怪的标点符号和 markdown 标记
                    title = textLines[0].replace(/^[#\*\-\"“”'\[\]]+|[#\*\-\"“”'\]\)]+$/g, '').trim();
                }
            }

            // 导入 marked 将 Markdown 转换为 HTML，因为 Tiptap 编辑器需要 HTML
            const { marked } = await import("marked");
            const htmlContent = await marked.parse(content);

            // 3. 为 AI 助手分配专属账号
            const AI_EMAIL = "ai_bot@ideaflow.local";
            let aiUser = await db.query.user.findFirst({
                where: eq(user.email, AI_EMAIL)
            });

            if (!aiUser) {
                // 如果不存在 AI 账号，自动创建一个
                const [newUser] = await db.insert(user).values({
                    id: crypto.randomUUID(),
                    name: "IdeaFlow AI",
                    email: AI_EMAIL,
                    emailVerified: true,
                    image: "https://api.dicebear.com/7.x/bottts/svg?seed=IdeaFlowAI&backgroundColor=b6e3f4"
                }).returning();
                aiUser = newUser;
            }

            // 4. 调用现成的服务插入数据库
            const article = await createArticleItem(
                {
                    title,
                    content: htmlContent, // 存入 HTML 格式供富文本编辑器渲染
                    summary, // n8n 传递过来的 AI 总结
                    tags,
                },
                aiUser.id
            );

            return c.json({ data: article, message: "文章导入成功" });
        } catch (error) {
            console.error("n8n Webhook 异常:", error);
            return c.json(createErrorResult("导入文章失败", error, 500), 500);
        }
    }
);
