import type { AuthConfig } from "@/lib/auth";
import { EmailOTPType } from "@/server/user/constants";
import z from "zod";

export const authConfig: AuthConfig = {
    protectedPages: ["/blog/create", "/blog/edit"],
    validates: {
        username: z
            .string()
            .min(6, "用户名至少6位")
            .max(15, "用户名最多15位")
            .regex(/^[\w$]+$/, "用户名只能包含大小写字母、数字、$ 和 _"),
        password: z
            .string()
            .min(8, "密码至少8位")
            .max(32, "密码最多32位")
            .regex(/^[\w$]+$/, "密码只能包含大小写字母、数字、$ 和 _"),
    },
    mails: {
        OTP: {
            rateLimit: process.env.NODE_ENV === 'production' ? 60 : 5,
            allowedAttempts: 5,
            expiresIn: process.env.NODE_ENV === 'production' ? 300 : 30000,
            send: {
                "email-verification": {
                    client: "gmail",
                    templatePath: "email-verification",
                    subject: (_type: `${EmailOTPType}`) => (appname: string, code: string) =>
                        `${appname}的用户注册邮件 | 您的验证码为${code}`,
                },
                "forget-password": {
                    client: "gmail",
                    templatePath: "forget-password",
                    subject: (_type: `${EmailOTPType}`) => (appname: string, code: string) =>
                        `${appname}的找回密码邮件 | 您的验证码为${code}`,
                },
            },
        },
    },
};
