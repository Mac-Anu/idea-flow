import { z } from "zod";
import {
    authResponseSchema,
    signInRequestSchema,
    signUpRequestSchema,
    userDetailRequestParamsSchema,
    userSchema,
    sessionSchema,
    forgetPasswordRequestSchema,
    sendOTPResponseSchema,
    otpRateLimitRequestSchema,
} from "./schema";
import { authRoutes } from "./routes/auth";

// 用户类型
export type User = z.infer<typeof userSchema>;

// 会话类型
export type Session = z.infer<typeof sessionSchema>;

// 认证响应类型
export type AuthResponse = z.infer<typeof authResponseSchema>;

// 登录请求类型
export type SignInRequest = z.infer<typeof signInRequestSchema>;

// 注册请求类型
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

// 用户详情请求参数类型
export type UserDetailRequestParams = z.infer<typeof userDetailRequestParamsSchema>;

// Better Auth 推断类型
export type AuthUser = typeof import("../../lib/auth").auth.$Infer.Session.user;
export type AuthSession = typeof import("../../lib/auth").auth.$Infer.Session.session;

// Better Auth API类型
export type AuthApiType = typeof authRoutes;

// 忘记密码请求类型
export type ResetPasswordRequest = z.infer<typeof forgetPasswordRequestSchema>;

// 发送验证码响应类型
export type SendOTPResponse = z.infer<typeof sendOTPResponseSchema>;

export interface EmailOTPPayload {
    email: string;
    code: string;
}
// 注册请求类型
export type SignupRequest = z.infer<typeof signUpRequestSchema>;

/**
 * 发送验证码响应类型
 */
export type sendOTPResponse = z.infer<typeof sendOTPResponseSchema>;

// 查询频率限制请求类型
export type OTPRateLimitRequest = z.infer<typeof otpRateLimitRequestSchema>;
