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
export const explainRequestSchema = z
    .object({
        text: z.string().min(1, "需要解释的文本不能为空").max(2000, "文本太长啦，请分段划词解释哦 (限制2000字内)").meta({ description: "用户划词选中的文本" }),
        context: z.string().optional().meta({ description: "选中文本所在的上下文段落，帮助AI更准确理解" }),
    })
    .meta({ description: "划词解释请求参数" });

export const explainResponseSchema = z
    .object({
        explanation: z.string().meta({ description: "AI生成的解释或翻译" }),
    })
    .meta({ description: "划词解释返回数据格式" });

export const editorRequestSchema = z
    .object({
        text: z.string().max(2000, "选中的文本太长啦 (限制2000字内)").meta({ description: "需要AI处理的文本内容" }),
        action: z.enum(["tldr", "polish", "continue"]).meta({ description: "执行的操作" }),
    })
    .meta({ description: "编辑器AI助手请求参数" });

export const editorResponseSchema = z
    .object({
        result: z.string().meta({ description: "AI生成的文本结果" }),
    })
    .meta({ description: "编辑器AI助手返回结果" });
