import { z } from "zod";
import type { ArticleSchema, createArticleSchema, updateArticleSchema } from "./schema";

export type Article = z.infer<typeof ArticleSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
