import { buildClient, fetchApi } from "@/lib/hono";
import type { articleApi } from "@/server/articles/route";
import { CreateArticleInput, UpdateArticleInput } from "@/server/articles/type";
const articleClient = buildClient<typeof articleApi>("/articles");
export const articlesApi = {
    list: async (options?: { headers?: Record<string, string> }) =>
        fetchApi(articleClient, (c) => c.index.$get({}, { headers: options?.headers })),

    detail: async (item: string, options?: { headers?: Record<string, string> }) =>
        fetchApi(articleClient, (c) => c[":item"].$get({ param: { item } }, { headers: options?.headers })),

    create: async (data: CreateArticleInput) =>
        fetchApi(articleClient, (c) => c.index.$post({ json: data })),

    update: async (id: string, data: UpdateArticleInput) =>
        fetchApi(articleClient, (c) => c[":id"].$put({ param: { id }, json: data })),

    delete: async (id: string) =>
        fetchApi(articleClient, (c) => c[":id"].$delete({ param: { id } })),

    trash: async () =>
        fetchApi(articleClient, (c) => c.trash.$get()),

    restore: async (id: string) =>
        fetchApi(articleClient, (c) => c[":id"].restore.$patch({ param: { id } })),
};
