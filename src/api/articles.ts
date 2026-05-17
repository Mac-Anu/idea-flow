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

    /**
     * 获取已发布的公开文章列表（无需登录）
     * 用于首页/博客公开页面的 SSR 渲染
     */
    published: async () => {
        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        try {
            const res = await fetch(`${baseUrl}/api/articles/public`, {
                next: { revalidate: 60 },
            });
            if (!res.ok) return [];
            const { data } = await res.json();
            return data || [];
        } catch {
            return [];
        }
    },
};
