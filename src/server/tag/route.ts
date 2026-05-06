import { describeRoute } from "hono-openapi";
import { isNil } from "lodash";
import { zValidator } from "@hono/zod-validator";
import { createHonoApp } from "../common/app";
import { AuthProtectedMiddleware } from "../user/middlwares";
import {
    createNotFoundErrorResponse,
    createServerErrorResponse,
    createSuccessResponse,
    createValidatorErrorResponse,
} from "../common/response";
import { tagItemRequestParamsSchema, tagListSchema, tagMutationSchema, tagSchema } from "./schema";
import { createTagItem, deleteTagItem, queryTagItem, queryTagList, updateTagItem } from "./service";

export const tagTags = ["标签操作"];
export const tagRoutes = createHonoApp()
    .get(
        "/:item",
        describeRoute({
            tags: tagTags,
            summary: "标签详情查询",
            description: "根据ID或名称查询单条标签信息",
            responses: {
                ...createSuccessResponse(tagSchema),
                ...createNotFoundErrorResponse("标签不存在"),
                ...createServerErrorResponse("查询标签数据失败"),
            },
        }),
        AuthProtectedMiddleware,
        zValidator("param", tagItemRequestParamsSchema),
        async (c) => {
            try {
                const { item } = c.req.valid("param");
                const userId = c.get("user")!.id;
                const result = await queryTagItem(item, userId);
                if (!isNil(result)) return c.json({ data: result }, 200);
                return c.json({ message: "标签不存在" }, 404);
            } catch (error) {
                return c.json({ message: "查询标签数据失败" }, 500);
            }
        },
    )
    .get(
        "/",
        describeRoute({
            tags: tagTags,
            summary: "标签列表查询",
            description: "获取当前用户创建的所有标签列表",
            responses: {
                ...createSuccessResponse(tagListSchema),
                ...createServerErrorResponse("查询标签列表失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const userId = c.get("user")!.id;
                const result = await queryTagList(userId);
                return c.json({ data: result }, 200);
            } catch (error) {
                return c.json({ message: "查询标签列表失败" }, 500);
            }
        },
    )
    .post(
        "/",
        zValidator("json", tagMutationSchema),
        describeRoute({
            tags: tagTags,
            summary: "创建标签",
            responses: {
                ...createSuccessResponse(tagSchema),
                ...createValidatorErrorResponse(),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            const userId = c.get("user")!.id;
            const data = await c.req.valid("json");
            const result = await createTagItem(data, userId);
            return c.json({ data: result }, 201);
        },
    )
    .patch(
        "/:item",
        zValidator("param", tagItemRequestParamsSchema),
        zValidator("json", tagMutationSchema),
        describeRoute({
            tags: tagTags,
            summary: "更新标签",
            responses: {
                ...createSuccessResponse(tagSchema),
                ...createNotFoundErrorResponse("标签不存在"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            const { item } = c.req.valid("param");
            const data = await c.req.valid("json");
            const userId = c.get("user")!.id;
            const result = await updateTagItem(item, data, userId);
            if (isNil(result)) return c.json({ message: "标签不存在" }, 404);
            return c.json({ data: result }, 200);
        },
    )
    .delete(
        "/:item",
        zValidator("param", tagItemRequestParamsSchema),
        describeRoute({
            tags: tagTags,
            summary: "删除标签",
            responses: {
                ...createSuccessResponse(tagSchema),
                ...createNotFoundErrorResponse("标签不存在"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            const { item } = c.req.valid("param");
            const userId = c.get("user")!.id;
            const result = await deleteTagItem(item, userId);
            if (isNil(result)) return c.json({ message: "标签不存在" }, 404);
            return c.json({ data: result }, 200);
        },
    );
