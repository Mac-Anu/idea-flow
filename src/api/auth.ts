import { usernameClient, emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { isNil } from "lodash";
import { appConfig } from "@/config/app";
import type { SignInRequest, SignUpRequest, User, AuthApiType, ResetPasswordRequest, OTPRateLimitRequest } from "@/server/user/type";
import { buildClient, fetchApi } from "@/lib/hono";

// Hono RPC 客户端
export const authFetchClient = buildClient<AuthApiType>("/auth");

// Better Auth 官方客户端
export const authClient = createAuthClient({
    baseURL: appConfig.baseUrl,
    basePath: "/api/auth",
    plugins: [usernameClient(), emailOTPClient()],
});

export const authApi = {
    /**
     * 用户登录 - 智能登录（支持用户名或邮箱）
     */
    signIn: async (
        data: SignInRequest,
        options?: {
            rememberMe?: boolean;
            callbackURL?: string;
            onSuccess?: (ctx?: any) => void;
            onError?: (error: any) => void;
        },
    ) => {
        try {
            const isEmail = data.username.includes("@");

            if (isEmail) {
                return await authClient.signIn.email(
                    {
                        email: data.username,
                        password: data.password,
                        callbackURL: options?.callbackURL,
                        rememberMe: options?.rememberMe ?? true,
                    },
                    {
                        onSuccess: options?.onSuccess,
                        onError: options?.onError,
                    },
                );
            } else {
                return await authClient.signIn.username(
                    {
                        username: data.username,
                        password: data.password,
                        callbackURL: options?.callbackURL,
                        rememberMe: options?.rememberMe ?? true,
                    },
                    {
                        onSuccess: options?.onSuccess,
                        onError: options?.onError,
                    },
                );
            }
        } catch (error) {
            if (options?.onError) {
                options.onError(error);
            }
            throw error;
        }
    },

    /**
     * 用户注册 (调用自定义后端接口)
     */
    signUp: async (data: SignUpRequest) => {
        // @ts-ignore: Hono RPC 类型推断在结合复杂的 zValidator 时可能会丢失路由类型
        return fetchApi(authFetchClient, async (c: any) => c["sign-up"].$post({ json: data }));
    },

    /**
     * 重置密码
     */
    resetPassword: async (data: ResetPasswordRequest) =>
        // @ts-ignore
        fetchApi(authFetchClient, async (c: any) => c['reset-password'].$post({ json: data })),

    /**
     * 发送邮箱验证码
     */
    sendEmailVerificationOTP: async (email: string) =>
        // @ts-ignore
        fetchApi(authFetchClient, async (c: any) =>
            c.otp['email-verification'].$post({ json: { email } }),
        ),

    /**
     * 发送忘记密码邮箱验证码
     */
    sendForgetPasswordOTP: async (credential: string) =>
        // @ts-ignore
        fetchApi(authFetchClient, async (c: any) =>
            c.otp['forget-password'].$post({ json: { credential } }),
        ),

    /**
     * 通过用户名或邮箱检查用户是否存在
     * @param credential
     */
    checkUserExists: async (credential: string) =>
        // @ts-ignore
        fetchApi(authFetchClient, async (c: any) =>
            c.check['user-exists'].$post({ json: { credential } }),
        ),

    /**
     * 检测用户名唯一性
     * @param username
     */
    checkUsernameUnique: async (username: string) =>
        // @ts-ignore
        fetchApi(authFetchClient, async (c: any) =>
            c.check['username-unique'].$post({ json: { username } }),
        ),

    /**
     * 检测邮箱唯一性
     * @param email
     */
    checkEmailUnique: async (email: string) =>
        // @ts-ignore
        fetchApi(authFetchClient, async (c: any) => c.check['email-unique'].$post({ json: { email } })),

    /**
     * 获取发送频率状态
     */
    getOTPStatus: async (data: OTPRateLimitRequest) =>
        // @ts-ignore
        fetchApi(authFetchClient, async (c: any) => c['email-otp'].status.$post({ json: data })),

    /**
     * 用户登出
     */
    signOut: async (options?: { onSuccess?: () => void }) => {
        return await authClient.signOut({
            fetchOptions: {
                onSuccess: options?.onSuccess,
            },
        });
    },

    /**
     * 获取会话信息
     */
    getSession: async () => authClient.getSession(),

    /**
     * 获取当前登录用户信息
     */
    getAuth: async () => {
        const session = await authClient.getSession();
        if (isNil(session) || isNil(session.data?.user)) return null;
        return session.data?.user as any as User;
    },
};
