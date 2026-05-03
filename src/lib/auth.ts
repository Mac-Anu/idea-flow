import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, openAPI, username } from "better-auth/plugins";
import { db } from "@/db";
import z from "zod";
import { authConfig } from "@/config/auth";
import { EmailOTPType } from "@/server/user/constants";
import { addOTPQueue } from "@/server/user/queue";
import {
    AliyunSendMailOptions,
    SmtpSendMailOptions,
    TencentCloudSendMailOptions,
} from "./mail/types";

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
                    await addOTPQueue(email, otp, type as any);
                },
            }),
            nextCookies(),
        ],
    });

interface BaseOTPSendConfig {
    /**
     * OTP邮件客户端名称,查看src/config/mail.ts
     */
    client?: string;
    /**
     * OTP邮件主题生成函数
     * @param type
     */
    subject: (type: `${EmailOTPType}`) => (...args: any[]) => string;
}

type AliyunOTPSendConfig = BaseOTPSendConfig &
    Omit<AliyunSendMailOptions, "to" | "vars" | "subject">;
type SmtpOTPSendConfig = BaseOTPSendConfig & Omit<SmtpSendMailOptions, "to" | "vars" | "subject">;
type TencentOTPSendConfig = BaseOTPSendConfig &
    Omit<TencentCloudSendMailOptions, "to" | "vars" | "subject">;
export interface AuthConfig {
    protectedPages: string[];
    validates: {
        username: z.ZodString;
        password: z.ZodString;
    };
    mails?: {
        /**
         * 验证码邮件配置
         */
        OTP?: {
            /**
             * 发送间隔时间, 单位秒，防止频繁发送
             */
            rateLimit?: number;
            /**
             * 同一个用户名或者邮箱的最大尝试次数
             */
            allowedAttempts?: number;
            /**
             * 验证码有效期，单位秒
             */
            expiresIn?: number;
            /**
             * 不同类型OTP邮件的发送配置
             */
            send?: {
                [K in EmailOTPType]?:
                    | AliyunOTPSendConfig
                    | SmtpOTPSendConfig
                    | TencentOTPSendConfig;
            };
        };
    };
}
export const auth = createServerAuth();
export interface AuthType {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
}
