import { z } from "zod";

export const errorSchema = z
    .object({
        code: z.number().optional().meta({ type: "number" }),
        message: z.string().meta({ type: "string" }),
        errors: z.any().optional().meta({ type: "object" }),
    })
    .strict();

// 简单成功响应 schema
export const successResultSchema = z.object({
    result: z.boolean(),
});

// 消息响应 schema
export const successMessageSchema = z.object({
    message: z.string(),
});

// 带消息的成功响应 schema
export const successMessageWithResultSchema = z.object({
    message: z.string().or(z.null()),
    result: z.boolean(),
});
