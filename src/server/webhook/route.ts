import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/db";
import { createArticleItem } from "../articles/service";
import { createErrorResult } from "../common/error";
import { describeRoute } from "hono-openapi";

export const webhookApi = new Hono();

const N8nWebhookSchema = z.object({
    title: z.string().min(1, "标题不能为空"),
    content: z.string().min(1, "正文不能为空"),
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
            const { title, content, tags } = c.req.valid("json");

            // 3. 确定要挂载的用户 (如果是个人博客，默认取数据库第一个用户)
            const firstUser = await db.query.user.findFirst();
            if (!firstUser) {
                return c.json(createErrorResult("系统中没有用户，无法创建文章", null, 400), 400);
            }

            // 4. 调用现成的服务插入数据库
            const article = await createArticleItem(
                {
                    title,
                    content,
                    tags,
                },
                firstUser.id
            );

            return c.json({ data: article, message: "文章导入成功" });
        } catch (error) {
            console.error("n8n Webhook 异常:", error);
            return c.json(createErrorResult("导入文章失败", error, 500), 500);
        }
    }
);
