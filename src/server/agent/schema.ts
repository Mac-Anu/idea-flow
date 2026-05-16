import { z } from "zod";

export const chatRequestSchema = z
    .object({
        messages: z.array(z.object({
            role: z.enum(["user", "system", "assistant"]),
            content: z.string().meta({ description: "发送给AI助手的问题或内容" }),

        })).min(1, "对话内容不能为空").meta({ description: "完整的对话历史记录" }),
    })
    .meta({ description: "调用AI助手的请求参数格式" });

export const chatResponseSchema = z
    .object({
        response: z.string().meta({ description: "最终生成的完美回答" }),
        history: z.array(z.any()).optional().meta({ description: "完整的反思审查对话历史链" }),
    })
    .meta({ description: "AI助手返回的响应数据格式" });
