import { buildClient, fetchApi } from "@/lib/hono";
import type { projectApi } from "@/server/projects/route";
import { CreateProjectInput, UpdateProjectInput } from "@/server/projects/type";

const projectClient = buildClient<typeof projectApi>("/projects");

export const projectsApi = {
    list: async (options?: { headers?: Record<string, string> }) =>
        fetchApi(projectClient, (c) => c.index.$get({}, { headers: options?.headers })),

    public: async (options?: { headers?: Record<string, string> }) =>
        fetchApi(projectClient, (c) => c.public.$get({}, { headers: options?.headers })),

    detail: async (item: string, options?: { headers?: Record<string, string> }) =>
        fetchApi(projectClient, (c) => c[":item"].$get({ param: { item } }, { headers: options?.headers })),

    create: async (data: CreateProjectInput) =>
        fetchApi(projectClient, (c) => c.index.$post({ json: data })),

    update: async (id: string, data: UpdateProjectInput) =>
        fetchApi(projectClient, (c) => c[":id"].$put({ param: { id }, json: data })),

    delete: async (id: string) =>
        fetchApi(projectClient, (c) => c[":id"].$delete({ param: { id } })),
};
