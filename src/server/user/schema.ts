import { z } from "zod";
import { authConfig } from "@/config/auth";
import { EmailOTPType } from "./constants";

// 用户登录请求 schema
export const signInRequestSchema = z.object({
    username: authConfig.validates.username,
    password: authConfig.validates.password,
});

// 用户注册请求 schema
export const signUpRequestSchema = z.object({
    username: authConfig.validates.username,
    email: z.email("请输入有效的邮箱地址"),
    otp: z.string().length(6, "验证码为6位数字"),
    password: authConfig.validates.password,
    validateType: z.enum(["email", "phone"]),
});

// 用户信息 schema
export const userSchema = z.object({
    id: z.string(),
    username: authConfig.validates.username,
    displayUsername: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
    emailVerified: z.boolean(),
    createdAt: z.string().meta({ description: "用户创建时间" }),
    updatedAt: z.string().meta({ description: "用户更新时间" }),
});

// 会话信息 schema
export const sessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.string().meta({ description: "session过期时间" }),
    token: z.string(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
});

// 认证响应 schema
export const authResponseSchema = z.object({
    user: userSchema.nullable(),
    session: sessionSchema.nullable(),
});

// 登出响应 schema
export const authSignoutResponseSchema = z.object({
    message: z.string(),
});

// 用户详情请求参数 schema
export const userDetailRequestParamsSchema = z.object({
    id: z.string().min(1, "ID不能为空"),
});
// 简单成功响应 schema
export const successResultSchema = z.object({
    result: z.boolean(),
});

// 消息响应 schema
export const successMessageSchema = z.object({
    message: z.string(),
});

// 带消息的成功响应 schema
export const successMessageWithResultSchema = z.object({
    message: z.string().or(z.null()),
    result: z.boolean(),
});

// 发送邮箱 OTP 请求 schema
export const sendEmailVerificationOTPRequestSchema = z.object({
    email: z.email("请输入有效的邮箱地址"),
});

// 发送忘记密码 OTP 请求 schema
export const sendForgetPasswordOTPRequestSchema = z.object({
    credential: authConfig.validates.username.or(z.email()),
});

// 发送验证码响应 schema
export const sendOTPResponseSchema = z.object({
    /**
     * 响应消息
     */
    message: z.string(),
    /**
     * 是否可以继续发送（在发送频率限制内则为false）
     */
    canSend: z.boolean(),
    /**
     * 发送频率限制时间
     */
    remainingTime: z.number().optional(),
    /**
     * 下一次可发送的时间戳
     */
    nextSendTime: z.number().optional(),
});

// 检测用户是否存在请求 schema
export const checkUserExistsSchema = sendForgetPasswordOTPRequestSchema;

// 查询发送频率限制请求 schema
export const otpRateLimitRequestSchema = z.object({
    credential: authConfig.validates.username.or(z.email()),
    type: z.enum(Object.values(EmailOTPType) as [string, ...string[]]),
});

// 检查用户名唯一性请求 schema
export const checkUsernameUniqueSchema = z.object({
    username: authConfig.validates.username,
});

// 检查邮箱唯一性请求 schema
export const checkEmailUniqueSchema = z.object({
    email: z.email("请输入有效的邮箱地址"),
});

// 找回密码请求 schema
export const forgetPasswordRequestSchema = z.object({
    credential: authConfig.validates.username.or(z.email()),
    otp: z.string().length(6, "验证码为6位数字"),
    password: authConfig.validates.password,
});

// 注册响应 schema (注意名字改成了驼峰式)
export const signUpResponseSchema = z.object({
    result: z.boolean(),
    user: userSchema,
});
