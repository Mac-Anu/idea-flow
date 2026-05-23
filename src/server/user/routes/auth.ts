import { isNil } from "lodash";
import { zValidator } from "@hono/zod-validator";
import { describeRoute } from "hono-openapi";
import { createHonoApp } from "../../common/app";
import { auth } from "@/lib/auth";
import {
    createSuccessResponse,
    create201SuccessResponse,
    createValidatorErrorResponse,
    createUnauthorizedErrorResponse,
    createServerErrorResponse,
    createNotFoundErrorResponse,
    createErrorResponse,
} from "../../common/response";
import {
    signInRequestSchema,
    authResponseSchema,
    authSignoutResponseSchema,
    signUpRequestSchema,
    forgetPasswordRequestSchema,
    sendEmailVerificationOTPRequestSchema,
    checkUserExistsSchema,
    checkUsernameUniqueSchema,
    checkEmailUniqueSchema,
    signUpResponseSchema,
    sendForgetPasswordOTPRequestSchema,
} from "../schema";
import { successMessageSchema, successMessageWithResultSchema } from "../../common/schema";
import {
    signIn,
    signOut,
    getCurrentSession,
    signUpByEmail,
    resetPasswordByEmail,
    sendOTP,
    queryUserByUsernameOrEmail,
    queryUserByUsername,
    queryUserByEmail,
} from "../service";
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
                ...create201SuccessResponse(signUpResponseSchema),
                ...createValidatorErrorResponse(),
                ...createUnauthorizedErrorResponse("注册失败"),
                ...createServerErrorResponse("注册失败"),
            },
        }),
        zValidator("json", signUpRequestSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                // 临时关闭注册功能，防止外人乱用 Token
                return c.json(createErrorResult("系统目前暂不开放注册，仅限受邀用户使用。"), 403);
                
                /*
                const { validateType, ...data } = c.req.valid("json");
                const result = await signUpByEmail(data);
                if (!result.result) {
                    return c.json(createErrorResult((result as any).message), 400);
                }
                return c.json(result, 201);
                */
            } catch (error: any) {
                return c.json(createErrorResult("注册失败", error), 500);
            }
        },
    )
    .post(
        "/reset-password",
        describeRoute({
            tags: userTags,
            summary: "找回密码",
            description: "通过邮件找回用户密码",
            responses: {
                ...createValidatorErrorResponse(),
                ...createSuccessResponse(successMessageWithResultSchema),
                ...createErrorResponse("请求错误", 400),
                ...createServerErrorResponse("服务器错误"),
            },
        }),
        zValidator("json", forgetPasswordRequestSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                const data = c.req.valid("json");
                const result = await resetPasswordByEmail(data);
                return c.json(result, 200);
            } catch (error: any) {
                return c.json(createErrorResult("重置密码失败", error), 500);
            }
        },
    )
    .post(
        "/otp/email-verification",
        describeRoute({
            tags: userTags,
            summary: "发送用户注册的邮箱验证码",
            description: "发送用户注册的邮箱验证码",
            responses: {
                ...createSuccessResponse(successMessageSchema),
                ...createValidatorErrorResponse(),
                ...createServerErrorResponse("发送邮箱验证码失败"),
            },
        }),
        zValidator("json", sendEmailVerificationOTPRequestSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                const { email } = c.req.valid("json");
                const res = await sendOTP(email, "email-verification");
                return c.json(res.result, res.code);
            } catch (error) {
                return c.json(createErrorResult("发送邮箱验证码错误", error), 500);
            }
        },
    )
    .post(
        "/otp/forget-password",
        describeRoute({
            tags: userTags,
            summary: "发送找回密码的邮箱验证码",
            description: "发送找回密码的邮箱验证码",
            responses: {
                ...createSuccessResponse(successMessageSchema),
                ...createValidatorErrorResponse(),
                ...createNotFoundErrorResponse("用户不存在"),
                ...createServerErrorResponse("发送邮箱验证码失败"),
            },
        }),
        zValidator("json", sendForgetPasswordOTPRequestSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                const { credential } = c.req.valid("json");
                const user = await queryUserByUsernameOrEmail(credential);
                if (isNil(user)) return c.json(createErrorResult("用户不存在"), 404);
                const res = await sendOTP(user.email, "forget-password");
                return c.json(res.result, res.code);
            } catch (error) {
                return c.json(createErrorResult("发送邮箱验证码错误", error), 500);
            }
        },
    )
    .post(
        "/check/user-exists",
        describeRoute({
            tags: userTags,
            summary: "通过用户名或邮箱检查对应的用户是否存在",
            description: "通过用户名或邮箱检查对应的用户是否存在",
            responses: {
                ...createValidatorErrorResponse(),
                ...createSuccessResponse(successMessageWithResultSchema),
                ...createServerErrorResponse("服务器错误"),
            },
        }),
        zValidator("json", checkUserExistsSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                const { credential } = c.req.valid("json");
                const result = await queryUserByUsernameOrEmail(credential);
                if (!isNil(result)) return c.json({ result: true, message: "用户存在" }, 200);
                return c.json({ result: false, message: "用户不存在" }, 200);
            } catch (error: any) {
                return c.json(createErrorResult("用户检查失败", error), 500);
            }
        },
    )
    .post(
        "/check/username-unique",
        describeRoute({
            tags: userTags,
            summary: "检测用户名的唯一性",
            description: "检测用户名的唯一性",
            responses: {
                ...createValidatorErrorResponse(),
                ...createSuccessResponse(successMessageWithResultSchema),
                ...createServerErrorResponse("服务器错误"),
            },
        }),
        zValidator("json", checkUsernameUniqueSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                const { username } = c.req.valid("json");
                const result = await queryUserByUsername(username);
                if (!isNil(result))
                    return c.json({ result: false, message: "用户名已被使用" }, 200);
                return c.json({ result: true, message: "用户名可以使用" }, 200);
            } catch (error: any) {
                return c.json(createErrorResult("用户名检测失败", error), 500);
            }
        },
    )
    .post(
        "/check/email-unique",
        describeRoute({
            tags: userTags,
            summary: "检测用户邮箱的唯一性",
            description: "检测用户邮箱的唯一性",
            responses: {
                ...createValidatorErrorResponse(),
                ...createSuccessResponse(successMessageWithResultSchema),
                ...createServerErrorResponse("服务器错误"),
            },
        }),
        zValidator("json", checkEmailUniqueSchema, defaultValidatorErrorHandler),
        async (c) => {
            try {
                const { email } = c.req.valid("json");
                const result = await queryUserByEmail(email);
                if (!isNil(result))
                    return c.json({ result: false, message: "邮箱地址已被使用" }, 200);
                return c.json({ result: true, message: "邮箱地址可以使用" }, 200);
            } catch (error: any) {
                return c.json(createErrorResult("邮箱地址检测失败", error), 500);
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

                if (result.error === 'USER_NOT_FOUND') {
                    return c.json(createErrorResult("登录失败", "账号不存在，请先注册", 404), 404);
                }
                if (result.error === 'INVALID_PASSWORD' || isNil(result.data?.token)) {
                    return c.json(createErrorResult("认证失败", "账号或密码错误", 401), 401);
                }

                return c.json(result.data, 200);
            } catch (error: any) {
                console.error("底层登录报错：", error);
                return c.json(createErrorResult("登录失败", "服务器内部错误，请稍后重试"), 500);
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
