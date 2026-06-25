import { z } from "zod";
import type { ProjectSchema, createProjectSchema, updateProjectSchema } from "./schema";

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
