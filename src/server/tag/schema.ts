import { z } from "zod";

export const tagSchema = z.object({
    id: z.string(),
    text: z.string(),
    userId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).meta({ description: "标签详情数据" });

export const tagListSchema = z.array(tagSchema).meta({ description: "标签列表数据" });

export const tagMutationSchema = z.object({
    text: z.string().min(1, "标签内容不能为空"),
});

export const tagItemRequestParamsSchema = z.object({
    item: z.string().meta({ description: "标签ID或名称" }),
});
