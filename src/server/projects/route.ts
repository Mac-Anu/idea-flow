import { isNil } from "lodash";
import { zValidator } from "@hono/zod-validator";
import { revalidatePath } from "next/cache";
import { createProjectSchema, updateProjectSchema, ProjectSchema } from "./schema";
import { describeRoute } from "hono-openapi";
import {
    create201SuccessResponse,
    createSuccessResponse,
    createValidatorErrorResponse,
    createNotFoundErrorResponse,
    createServerErrorResponse,
} from "../common/response";
import {
    createProjectItem,
    deleteProjectItem,
    queryProjectItem,
    queryProjectList,
    queryPublicProjects,
    updateProjectItem,
} from "./service";
import { createHonoApp } from "../common/app";
import { AuthProtectedMiddleware } from "../user/middlwares";

export const projectTags = ["项目作品"];

export const projectApi = createHonoApp()
    .get(
        "/",
        describeRoute({
            tags: projectTags,
            summary: "项目列表查询(后台)",
            description: "获取当前用户的所有项目，按排序权重与更新时间排列",
            responses: {
                ...createSuccessResponse(ProjectSchema),
                ...createServerErrorResponse("查询项目列表失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const userId = c.get("user")!.id;
                const data = await queryProjectList(userId);
                return c.json({ data });
            } catch {
                return c.json({ message: "查询项目列表失败" }, 500);
            }
        },
    )
    .get(
        "/public",
        describeRoute({
            tags: projectTags,
            summary: "公开项目列表",
            description: "获取所有公开项目，无需登录",
            responses: {
                ...createSuccessResponse(ProjectSchema),
                ...createServerErrorResponse("查询公开项目失败"),
            },
        }),
        async (c) => {
            try {
                const data = await queryPublicProjects();
                return c.json({ data });
            } catch {
                return c.json({ message: "查询公开项目失败" }, 500);
            }
        },
    )
    .post(
        "/",
        zValidator("json", createProjectSchema),
        describeRoute({
            tags: projectTags,
            summary: "项目创建",
            description: "创建一个新项目",
            responses: {
                ...create201SuccessResponse(ProjectSchema),
                ...createValidatorErrorResponse(),
                ...createServerErrorResponse("创建项目失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const data = await c.req.valid("json");
                const userId = c.get("user")!.id;
                const newProject = await createProjectItem(data, userId);
                revalidatePath("/", "layout");
                revalidatePath("/projects", "page");
                return c.json({ newProject }, 201);
            } catch {
                return c.json({ message: "创建项目失败" }, 500);
            }
        },
    )
    .put(
        "/:id",
        zValidator("json", updateProjectSchema),
        describeRoute({
            tags: projectTags,
            summary: "项目更新",
            description: "根据项目ID更新内容，仅原作者可操作",
            responses: {
                ...createSuccessResponse(ProjectSchema),
                ...createValidatorErrorResponse(),
                ...createNotFoundErrorResponse("项目不存在"),
                ...createServerErrorResponse("更新项目失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const id = c.req.param("id");
                const userId = c.get("user")!.id;
                const data = await c.req.valid("json");
                const updateProject = await updateProjectItem(id, data, userId);
                if (isNil(updateProject)) return c.json({ message: "项目不存在或无权操作" }, 404);
                revalidatePath("/", "layout");
                revalidatePath("/projects", "page");
                revalidatePath(`/projects/${updateProject.slug}`, "page");
                return c.json({ updateProject });
            } catch {
                return c.json({ message: "更新项目失败" }, 500);
            }
        },
    )
    .delete(
        "/:id",
        describeRoute({
            tags: projectTags,
            summary: "项目删除",
            description: "删除项目(物理删除)，仅原作者可操作",
            responses: {
                ...createSuccessResponse(ProjectSchema),
                ...createNotFoundErrorResponse("项目不存在"),
                ...createServerErrorResponse("删除项目失败"),
            },
        }),
        AuthProtectedMiddleware,
        async (c) => {
            try {
                const id = c.req.param("id");
                const userId = c.get("user")!.id;
                const deleteProject = await deleteProjectItem(id, userId);
                if (isNil(deleteProject)) return c.json({ message: "项目不存在或无权操作" }, 404);
                revalidatePath("/", "layout");
                revalidatePath("/projects", "page");
                return c.json({ deleteProject });
            } catch {
                return c.json({ message: "删除项目失败" }, 500);
            }
        },
    )
    .get(
        "/:item",
        describeRoute({
            tags: projectTags,
            summary: "项目详情查询",
            description: "可传入项目 id 或 slug 查询详情，无需登录",
            responses: {
                ...createSuccessResponse(ProjectSchema),
                ...createNotFoundErrorResponse("项目不存在"),
                ...createServerErrorResponse("查询项目详情失败"),
            },
        }),
        async (c) => {
            try {
                const item = c.req.param("item");
                const project = await queryProjectItem(item);
                if (isNil(project)) return c.json({ message: "项目不存在" }, 404);
                return c.json({ project });
            } catch {
                return c.json({ message: "查询项目详情失败" }, 500);
            }
        },
    );
