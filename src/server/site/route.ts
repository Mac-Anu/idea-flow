import { zValidator } from "@hono/zod-validator";
import { describeRoute } from "hono-openapi";
import { updateSiteProfileSchema, SiteProfileSchema } from "./schema";
import {
    createSuccessResponse,
    createValidatorErrorResponse,
    createServerErrorResponse,
} from "../common/response";
import { getSiteProfile, updateSiteProfile } from "./service";
import { createHonoApp } from "../common/app";
import { AuthProtectedMiddleware } from "../user/middlwares";

export const siteTags = ["站点配置"];

export const siteApi = createHonoApp()
    .get(
        "/public",
        describeRoute({
            tags: siteTags,
            summary: "站点 Profile 查询",
            description: "获取公开的站点 Profile（版头/头像/社媒），无需登录",
            responses: {
                ...createSuccessResponse(SiteProfileSchema),
                ...createServerErrorResponse("查询站点配置失败"),
            },
        }),
        async (c) => {
            try {
                const profile = await getSiteProfile();
                return c.json({ profile });
            } catch {
                return c.json({ message: "查询站点配置失败" }, 500);
            }
        },
    )
    .put(
        "/",
        zValidator("json", updateSiteProfileSchema),
        describeRoute({
            tags: siteTags,
            summary: "更新站点 Profile",
            description: "更新版头/头像/社媒等站点配置，仅登录用户可操作",
            responses: {
                ...createSuccessResponse(SiteProfileSchema),
                ...createValidatorErrorResponse(),
                ...createServerErrorResponse("更新站点配置失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const data = await c.req.valid("json");
                const userId = c.get("user")!.id;
                const profile = await updateSiteProfile(data, userId);
                return c.json({ profile });
            } catch {
                return c.json({ message: "更新站点配置失败" }, 500);
            }
        },
    );
