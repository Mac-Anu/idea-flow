import { zValidator } from "@hono/zod-validator";
import { describeRoute } from "hono-openapi";
import { createHonoApp, serverIncs } from "../common/app";
import { AuthProtectedMiddleware } from "../user/middlwares";
import { reflectionAgent, llm } from "./index";
import { chatRequestSchema, chatResponseSchema, explainRequestSchema, explainResponseSchema, editorRequestSchema, editorResponseSchema } from "./schema";
import { createSuccessResponse, createServerErrorResponse } from "../common/response";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getRedisClient } from "@/lib/redis";
import crypto from "crypto";
import type { AuthEnv } from "../user/middlwares";
export const agentTags = ["AI智能体"];
export const agentApi = createHonoApp().post(
    "/chat",
    zValidator("json", chatRequestSchema),
    describeRoute({
        tags: agentTags,
        summary: "AI 助理反思问答",
        description: "调用基于 LangGraph 的反思智能体，由 AI 自动审查多轮直到生成完美答案",
        responses: {
            ...createSuccessResponse(chatResponseSchema),
            ...createServerErrorResponse("AI 生成失败"),
        },
    }),
    AuthProtectedMiddleware,
    async (c) => {
        const { messages } = await c.req.valid("json");
        const user = (c as any).get("user");

        try {
            // AI 请求频率限制：每分钟最多 10 次
            const redis = getRedisClient(serverIncs.redis);
            const rateLimitKey = `ai:ratelimit:chat:${user?.id || "anonymous"}`;
            const count = await redis.incr(rateLimitKey);
            if (count === 1) {
                await redis.expire(rateLimitKey, 60);
            }
            if (count > 10) {
                return c.json({ message: "调用过于频繁，请等待一分钟后再试" }, 429);
            }

            // 调用在 agent/index.ts 里写好的 LangGraph
            const result = await reflectionAgent.invoke({
                messages: messages
            });

            // 如果最后一条消息是审查员的 PERFECT 许可，那么实际的答案其实在倒数第二条里
            const lastMsg = result.messages[result.messages.length - 1];
            const finalContent = typeof lastMsg.content === 'string' && lastMsg.content.includes("PERFECT")
                ? result.messages[result.messages.length - 2].content
                : lastMsg.content;
            
            // 把完整的思考过程也返回给前端
            const fullHistory = result.messages.map((m: any) => ({
                role: m._getType ? m._getType() : "unknown",
                content: m.content
            }));
            
            return c.json({ 
                data: { 
                    response: finalContent, 
                    history: fullHistory 
                } 
            });
        } catch (error) {
            console.error("Agent Error:", error);
            return c.json({ message: "AI 生成失败，请检查 API Key 或网络环境" }, 500);
        }
    }
)
.post(
    "/explain",
    zValidator("json", explainRequestSchema),
    describeRoute({
        tags: agentTags,
        summary: "AI 划词解释",
        description: "提供文本解释、翻译和术语科普，支持结合上下文进行精准回答",
        responses: {
            ...createSuccessResponse(explainResponseSchema),
            ...createServerErrorResponse("AI 解释失败"),
        },
    }),
    AuthProtectedMiddleware,
    async (c) => {
        const { text, context } = await c.req.valid("json");

        try {
            // Redis 极速缓存逻辑：将划词和上下文生成唯一 MD5 Hash
            const redis = getRedisClient(serverIncs.redis);
            const hashInput = context ? `${text}|${context}` : text;
            const hash = crypto.createHash("md5").update(hashInput).digest("hex");
            const cacheKey = `ai:explain:${hash}`;

            // 先查缓存，如果命中直接 0毫秒返回
            const cachedResponse = await redis.get(cacheKey);
            if (cachedResponse) {
                return c.json({ data: { explanation: cachedResponse } });
            }

            const systemPrompt = `你是一个专业的阅读助手。你的任务是解释用户选中的文本。
如果选中文本是外语，请翻译为优雅的中文。
如果选中文本是专业术语，请用通俗易懂的语言解释。
如果选中文本是一句长难句，请剖析它的核心意思。
请保持回答极其简明扼要，直接给出答案，不要多余的寒暄。`;

            const userPrompt = context 
                ? `选中文本：\n"${text}"\n\n上下文参考：\n"${context}"`
                : `选中文本：\n"${text}"`;

            const response = await llm.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt)
            ]);

            const explanationText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

            // 将大模型结果存入缓存，有效期 30 天
            await redis.setex(cacheKey, 30 * 24 * 3600, explanationText);

            return c.json({
                data: {
                    explanation: explanationText
                }
            });
        } catch (error) {
            console.error("Agent Explain Error:", error);
            return c.json({ message: "AI 解释失败，请检查网络" }, 500);
        }
    }
)
.post(
    "/editor",
    zValidator("json", editorRequestSchema),
    describeRoute({
        tags: agentTags,
        summary: "编辑器 AI 助手",
        description: "提供文章导读、内容润色和智能续写功能",
        responses: {
            ...createSuccessResponse(editorResponseSchema),
            ...createServerErrorResponse("AI 处理失败"),
        },
    }),
    AuthProtectedMiddleware,
    async (c) => {
        const { text, action } = await c.req.valid("json");
        const user = (c as any).get("user");

        try {
            // AI 请求频率限制：每分钟最多 10 次
            const redis = getRedisClient(serverIncs.redis);
            const rateLimitKey = `ai:ratelimit:editor:${user?.id || "anonymous"}`;
            const count = await redis.incr(rateLimitKey);
            if (count === 1) {
                await redis.expire(rateLimitKey, 60);
            }
            if (count > 10) {
                return c.json({ message: "调用过于频繁，请等待一分钟后再试" }, 429);
            }

            let systemPrompt = "";
            let userPrompt = `文本：\n"${text}"`;

            if (action === "tldr") {
                systemPrompt = `你是一个专业的文章导读助手。请为用户提供的一段文本或全篇文章提取精炼的导读摘要（TL;DR）。
请使用一段简短流畅的文字，不要超过200字。直接返回摘要，不要包含多余的寒暄。`;
            } else if (action === "polish") {
                systemPrompt = `你是一个专业的文字编辑。请对用户提供的文本进行深度润色。
要求：修正错别字和语病，提升用词专业度和行文流畅性。保留原文的段落结构和核心意思。直接返回润色后的纯文本，不要包含多余的寒暄。`;
            } else if (action === "continue") {
                systemPrompt = `你是一个优秀的共创作家。请顺着用户提供的文本内容，自然地续写一段后续内容。
要求：风格与上文保持一致，逻辑连贯。直接返回续写的新内容，不要重复用户原本提供的文本，也不要寒暄。`;
            }

            const response = await llm.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt)
            ]);

            return c.json({
                data: {
                    result: response.content
                }
            });
        } catch (error) {
            console.error("Agent Editor Error:", error);
            return c.json({ message: "AI 处理失败，请检查网络" }, 500);
        }
    }
);

