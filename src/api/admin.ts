import { buildClient } from "@/lib/hono";
import type { adminApi } from "@/server/admin/route";

export const adminFetchClient = buildClient<typeof adminApi>("/admin");
