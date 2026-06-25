import { db } from "@/db";
import { siteProfile, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UpdateSiteProfileInput } from "./type";

/** 站长用户名兜底：site_profile 表为空时按此用户名定位站长 */
const FALLBACK_OWNER_USERNAME = process.env.SITE_OWNER_USERNAME || "macanu";

let cachedOwnerId: string | null = null;

/**
 * 获取站长用户 ID。
 * 优先取 site_profile 首行的 userId；表为空则降级查 username=站长名 的用户。
 * 结果在进程内缓存（站长 ID 不会变）。
 *
 * @returns 站长 userId，找不到返回 null（调用方应做空查询保护）
 */
export const getSiteOwnerId = async (): Promise<string | null> => {
    if (cachedOwnerId) return cachedOwnerId;

    const [profile] = await db.select({ userId: siteProfile.userId }).from(siteProfile).limit(1);
    if (profile?.userId) {
        cachedOwnerId = profile.userId;
        return cachedOwnerId;
    }

    const [owner] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.username, FALLBACK_OWNER_USERNAME))
        .limit(1);
    cachedOwnerId = owner?.id ?? null;
    return cachedOwnerId;
};

/**
 * 读取站点 Profile（公开页与后台共用）。表为空返回 null（调用方降级到默认值）。
 */
export const getSiteProfile = async () => {
    const [profile] = await db.select().from(siteProfile).limit(1);
    return profile ?? null;
};

/**
 * 更新站点 Profile（后台用）。若不存在则创建（首行绑定当前用户）。
 *
 * @param data - 增量更新负载
 * @param userId - 当前操作用户 ID
 */
export const updateSiteProfile = async (data: UpdateSiteProfileInput, userId: string) => {
    const existing = await getSiteProfile();

    if (!existing) {
        const [created] = await db
            .insert(siteProfile)
            .values({ ...data, userId })
            .returning();
        cachedOwnerId = created?.userId ?? cachedOwnerId;
        return created;
    }

    const [updated] = await db
        .update(siteProfile)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(siteProfile.id, existing.id))
        .returning();
    return updated;
};
