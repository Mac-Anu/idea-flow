import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, openAPI, username } from "better-auth/plugins";
import { db } from "@/db";
import z from "zod";
import { authConfig } from "@/config/auth";
import { sendOTPHandler } from "@/server/user/service";

export const createServerAuth = () =>
    betterAuth({
        database: drizzleAdapter(db, {
            provider: "pg",
        }),
        emailAndPassword: {
            enabled: true,
            autoSignIn: false,
        },
        basePath: "/api/auth",
        plugins: [
            // 用户名登录插件
            username(),
            // openapi插件
            openAPI({
                path: "/reference",
                disableDefaultReference: false,
            }),
            emailOTP({
                allowedAttempts: authConfig.mails?.OTP?.allowedAttempts,
                expiresIn: authConfig.mails?.OTP?.expiresIn,
                async sendVerificationOTP({ email, otp, type }) {
                    sendOTPHandler({ email, code: otp }, type);
                },
            }),
            nextCookies(),
        ],
    });

export interface AuthConfig {
    protectedPages: string[];
    validates: {
        username: z.ZodString;
        password: z.ZodString;
    };
}
export const auth = createServerAuth();
export interface AuthType {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
}
