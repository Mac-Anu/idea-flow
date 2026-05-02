import { isNil } from "lodash";
import { zValidator } from "@hono/zod-validator";
import { describeRoute } from "hono-openapi";
import { createHonoApp } from "../../common/app";
import { auth } from "@/lib/auth";
import {
    createSuccessResponse,
    createValidatorErrorResponse,
    createUnauthorizedErrorResponse,
    createServerErrorResponse,
} from "../../common/response";
import {
    signInRequestSchema,
    authResponseSchema,
    authSignoutResponseSchema,
    signUpRequestSchema,
} from "../schema";
import { signIn, signOut, getCurrentSession, signUpByEmail } from "../service";
import { createErrorResult, defaultValidatorErrorHandler } from "../../common/error";
import type { Context } from "hono";

const app = createHonoApp();

export const userTags = ["用户认证"];

export const authRoutes = app
    // ======================================
    // 0. 用户注册
    // ======================================
    .post(
        "/sign-up",
        describeRoute({
            tags: userTags,
            summary: "用户注册",
            description: "注册新用户",
            responses: {
                ...createSuccessResponse(authResponseSchema),
                ...createValidatorErrorResponse(),
                ...createUnauthorizedErrorResponse("注册失败"),
                ...createServerErrorResponse("注册失败"),
            },
        }),
        zValidator("json", signUpRequestSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                const { validateType, ...data } = c.req.valid("json");
                if (validateType !== "email") throw new Error("目前仅支持邮箱注册");
                const result = await signUpByEmail(data);
                if (!result.result) {
                    return c.json(createErrorResult(result.message), 400);
                }
                return c.json(result, 201);
            } catch (error: any) {
                return c.json(createErrorResult("注册失败", error), 500);
            }
        },
    )
    // ======================================
    // 1. 用户名/邮箱登录
    // ======================================
    .post(
        "/sign-in/username",
        describeRoute({
            tags: userTags,
            summary: "用户名登录",
            description: "支持使用用户名或邮箱进行登录",
            responses: {
                ...createSuccessResponse(authResponseSchema),
                ...createValidatorErrorResponse(),
                ...createUnauthorizedErrorResponse("认证失败"),
                ...createServerErrorResponse("登录失败"),
            },
        }),
        zValidator("json", signInRequestSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                const { username, password } = c.req.valid("json");

                // 使用我们在 service 里写的带 Drizzle 翻译的认证
                const result = await signIn(username, password);

                if (isNil(result) || isNil(result.token)) {
                    return c.json(createErrorResult("认证失败", "用户名或密码错误", 401), 401);
                }
                return c.json(result, 200);
            } catch (error: any) {
                return c.json(createErrorResult("登录失败", error), 500);
            }
        },
    )

    // ======================================
    // 2. 用户登出
    // ======================================
    .post(
        "/sign-out",
        describeRoute({
            tags: userTags,
            summary: "用户登出",
            description: "注销当前用户会话",
            responses: {
                ...createSuccessResponse(authSignoutResponseSchema),
                ...createServerErrorResponse("登出失败"),
            },
        }),
        async (c) => {
            try {
                await signOut(c.req.raw);
                return c.json({ message: "登出成功" }, 200);
            } catch (error) {
                return c.json(createErrorResult("登出失败", error), 500);
            }
        },
    )

    // ======================================
    // 3. 获取会话信息
    // ======================================
    .get(
        "/get-session",
        describeRoute({
            tags: userTags,
            summary: "获取会话信息",
            description: "获取当前用户的会话信息（开机自检）",
            responses: {
                ...createSuccessResponse(authResponseSchema),
                ...createServerErrorResponse("获取会话失败"),
            },
        }),
        async (c) => {
            try {
                const session = await getCurrentSession(c.req.raw);
                return c.json(
                    {
                        user: session?.user || null,
                        session: session?.session || null,
                    },
                    200,
                );
            } catch (error) {
                return c.json(createErrorResult("获取会话失败", error), 500);
            }
        },
    )

    // ======================================
    // 万能网兜：保留 Better-Auth 核心逻辑兜底
    // （千万不能删，否则第三方登录、改密等内置功能全部失效）
    // ======================================
    .all("*", (c) => {
        return auth.handler(c.req.raw);
    });
