import { Hono } from "hono";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { desc, eq, isNull, isNotNull } from "drizzle-orm";
import { isNil } from "lodash";
import { zValidator } from "@hono/zod-validator";
import { createArticleSchema, updateArticleSchema } from "./schema";
import { describeRoute } from "hono-openapi";
import {
    create201SuccessResponse,
    createSuccessResponse,
    createValidatorErrorResponse,
    createNotFoundErrorResponse,
    createServerErrorResponse,
} from "../common/response";
import {
    createArticleItem,
    deleteArticleItem,
    queryArticleId,
    queryArticleItem,
    queryArticleList,
    queryArticleSlug,
    updateArticleItem,
    queryArticleTrashList,
    restoreArticleItem,
    searchArticles,
    queryAllTags,
} from "./service";
import { createHonoApp } from "../common/app";
import { AuthProtectedMiddleware } from "../user/middlwares";

export const articleTags = ["文章操作"];
export const articleApi = createHonoApp()
    .get(
        "/",
        describeRoute({
            tags: articleTags,
            summary: "文章列表查询",
            description: "获取所有未删除的文章列表，按更新时间倒序排列",
            responses: {
                ...createSuccessResponse(createArticleSchema),
                ...createServerErrorResponse("查询文章列表失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const userId = c.get("user")!.id;
                const data = await queryArticleList(userId);
                return c.json({ data });
            } catch (error) {
                return c.json({ message: "查询文章列表失败" }, 500);
            }
        },
    )
    .get(
        "/search",
        describeRoute({
            tags: articleTags,
            summary: "文章搜索",
            description: "根据关键词搜索文章，支持标题和内容搜索",
            responses: {
                ...createSuccessResponse(createArticleSchema),
                ...createServerErrorResponse("搜索文章失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const query = c.req.query("q") ?? "";
                const titleOnly = c.req.query("titleOnly") === "true";
                const userId = c.get("user")!.id;
                const articles = await searchArticles(query, titleOnly, userId);
                return c.json({ articles });
            } catch (error) {
                return c.json({ message: "搜索文章失败" }, 500);
            }
        },
    )


    .post(
        "/",
        zValidator("json", createArticleSchema),
        describeRoute({
            tags: articleTags,
            summary: "文章创建",
            description: "创建一篇新文章",
            responses: {
                ...create201SuccessResponse(createArticleSchema),
                ...createValidatorErrorResponse(),
                ...createServerErrorResponse("创建文章失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            const data = await c.req.valid("json");
            const userId = c.get("user")!.id;
            const newArticle = await createArticleItem(data, userId);
            return c.json({ newArticle });
        },
    )
    .put(
        "/:id",
        zValidator("json", updateArticleSchema),
        describeRoute({
            tags: articleTags,
            summary: "文章更新",
            description: "根据文章ID更新标题和内容",
            responses: {
                ...createSuccessResponse(createArticleSchema),
                ...createValidatorErrorResponse(),
                ...createNotFoundErrorResponse("文章不存在"),
                ...createServerErrorResponse("更新文章失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            const id = c.req.param("id");
            const userId = c.get("user")!.id;
            const data = await c.req.valid("json");
            const updateArticle = await updateArticleItem(id, data, userId);
            return c.json({ updateArticle });
        },
    )
    .delete(
        "/:id",
        describeRoute({
            tags: articleTags,
            summary: "文章软删除",
            description: "将文章移入回收站（软删除，数据不会真正丢失）",
            responses: {
                ...createSuccessResponse(createArticleSchema),
                ...createNotFoundErrorResponse("文章不存在"),
                ...createServerErrorResponse("删除文章失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            const id = c.req.param("id");
            const userId = c.get("user")!.id;
            const deleteArticle = await deleteArticleItem(id, userId);
            return c.json({ deleteArticle });
        },
    )
    .get(
        "/trash",
        describeRoute({
            tags: articleTags,
            summary: "回收站文章查询",
            description: "获取所有已删除的文章列表",
            responses: {
                ...createSuccessResponse(createArticleSchema),
                ...createServerErrorResponse("查询回收站文章失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            const userId = c.get("user")!.id;
            const data = await queryArticleTrashList(userId);
            return c.json({ data });
        },
    )
    .get(
        "/tags/list",
        describeRoute({
            tags: articleTags,
            summary: "文章标签列表查询",
            description: "获取用户所有使用过的文章标签去重列表",
            responses: {
                ...createServerErrorResponse("查询标签失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const userId = c.get("user")!.id;
                const tags = await queryAllTags(userId);
                return c.json({ tags });
            } catch (error) {
                return c.json({ message: "查询标签失败" }, 500);
            }
        },
    )
    .get(
        "/:item",
        describeRoute({
            tags: articleTags,
            summary: "文章详情查询",
            description: "可以传入文章id或者slug查询文章详情",
            responses: {
                ...createSuccessResponse(createArticleSchema),
                ...createNotFoundErrorResponse("文章不存在"),
                ...createServerErrorResponse("查询文章详情失败"),
            },
        }),
        async (c) => {
            try {
                const item = c.req.param("item");
                const article = await queryArticleItem(item);
                if (isNil(article)) return c.json({ message: "文章不存在" }, 404);
                return c.json({ article });
            } catch (error) {
                return c.json({ message: "查询文章详情失败" }, 500);
            }
        },
    )
    .patch(
        "/:id/restore",
        describeRoute({
            tags: articleTags,
            summary: "恢复已删除文章",
            description: "将回收站中的文章恢复到正常列表",
            responses: {
                ...createSuccessResponse(createArticleSchema),
                ...createNotFoundErrorResponse("文章不存在"),
                ...createServerErrorResponse("恢复文章失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            const id = c.req.param("id");
            const userId = c.get("user")!.id;
            const restoreArticle = await restoreArticleItem(id, userId);
            return c.json({ restoreArticle });
        },
    );
