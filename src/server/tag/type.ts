import { z } from "zod";
import {
    tagItemRequestParamsSchema,
    tagListSchema,
    tagMutationSchema,
    tagSchema,
} from "./schema";

export type TagItemRequestParams = z.infer<typeof tagItemRequestParamsSchema>;
export type TagItem = z.infer<typeof tagSchema>;
export type TagList = z.infer<typeof tagListSchema>;
export type TagMutation = z.infer<typeof tagMutationSchema>;
