import type { MailConfig } from "@/lib/mail/types";

export const mailConfig: MailConfig = {
    // 默认使用的邮件客户端名称（对应下面 clients 数组里的 name 字段）
    defaultClient: "gmail",
    clients: [
        {
            name: "gmail",
            type: "smtp",
            // nodemailer 连接 Gmail SMTP 服务器需要的参数
            options: {
                host: process.env.SMTP_HOST!,
                port: Number(process.env.SMTP_PORT ?? 465),
                secure: process.env.SMTP_SECURE === "true", // 465 端口用 true（SSL），587 端口用 false（STARTTLS）
                auth: {
                    user: process.env.SMTP_USER!,
                    pass: process.env.SMTP_PASS!,
                },
            },
            // 发邮件时的默认发件人地址
            default: {
                from: process.env.SMTP_FROM!,
            },
        },
    ],
};
