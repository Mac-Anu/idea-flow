import { zValidator } from "@hono/zod-validator";
import { describeRoute } from "hono-openapi";
import { createHonoApp } from "../common/app";
import { AuthProtectedMiddleware } from "../user/middlwares";
import { reflectionAgent } from "./index";
import { chatRequestSchema, chatResponseSchema } from "./schema";
import { createSuccessResponse, createServerErrorResponse } from "../common/response";

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

        try {
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
);
