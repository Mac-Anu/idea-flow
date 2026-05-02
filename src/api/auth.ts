import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { isNil } from "lodash";
import { appConfig } from "@/config/app";
import type { SignInRequest, User } from "@/server/user/type";

// Better Auth 官方客户端（支持用户名登录）
export const authClient = createAuthClient({
    baseURL: appConfig.baseUrl,
    basePath: "/api/auth",
    plugins: [usernameClient()],
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
        } catch (error) {
            if (options?.onError) {
                options.onError(error);
            }
            throw error;
        }
    },

    /**
     * 用户注册
     */
    signUp: async (
        data: typeof import("@/server/user/schema").signUpRequestSchema._type,
        options?: {
            onSuccess?: (ctx?: any) => void;
            onError?: (error: any) => void;
        },
    ) => {
        try {
            return await authClient.signUp.email({
                email: data.email,
                password: data.password,
                name: data.username,
                fetchOptions: {
                    onSuccess: options?.onSuccess,
                    onError: options?.onError,
                },
            });
        } catch (error) {
            if (options?.onError) options.onError(error);
            throw error;
        }
    },

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
