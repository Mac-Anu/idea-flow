import { buildClient, fetchApi } from "@/lib/hono";
import type { siteApi } from "@/server/site/route";
import { UpdateSiteProfileInput } from "@/server/site/type";

const siteClient = buildClient<typeof siteApi>("/site");

export const siteApiClient = {
    public: async (options?: { headers?: Record<string, string> }) =>
        fetchApi(siteClient, (c) => c.public.$get({}, { headers: options?.headers })),

    update: async (data: UpdateSiteProfileInput) =>
        fetchApi(siteClient, (c) => c.index.$put({ json: data })),
};
