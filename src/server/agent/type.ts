import { z } from "zod";
import { chatRequestSchema, chatResponseSchema } from "./schema";

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
