import { isNil, omit } from "lodash";

import type { MailSendOptions } from "@/lib/mail/types";

import { appConfig } from "@/config/app";
import { authConfig } from "@/config/auth";
import { sendMail } from "@/lib/mail";
// src/server/user/rateLimit.ts - OTP 发送频率限制服务
import { getRedisClient } from "@/lib/redis";
import { getDayjs } from "@/lib/time";
import { deepMerge } from "@/lib/utils";

import type { EmailOTPType } from "./constants";
import type { EmailOTPPayload, sendOTPResponse } from "./type";
import { serverIncs } from "../common/app";
import { queryUserByUsernameOrEmail } from "./service";

const OTP_RATE_LIMIT_KEY_PREFIX = "otp:rate_limit:";
/**
 * 验证码邮件发送处理器
 * @param data
 * @param type
 * @param options
 */
export async function sendOTPHandler(
    data: EmailOTPPayload,
    type: `${EmailOTPType}`,
    options?: MailSendOptions,
) {
    try {
        const config = authConfig.mails?.OTP?.send?.[type];

        if (!isNil(config)) {
            const newOptions = deepMerge(
                omit(config, ["client"]),
                {
                    ...(omit(options, ["vars", "to", "subject"]) ?? {}),
                    vars: {
                        code: data.code,
                        appname: appConfig.appName,
                        expire: Math.round(
                            getDayjs()
                                .duration(authConfig.mails?.OTP?.expiresIn ?? 300, "second")
                                .asMinutes(),
                        ),
                    },
                    to: [data.email],
                    subject: config.subject?.(type)(appConfig.appName, data.code),
                },
                "replace",
            );
            return sendMail(newOptions as any as MailSendOptions, config.client);
        }
        return new Error("邮件配置不存在");
    } catch (error) {
        throw new Error(`发送验证邮件失败: ${(error as Error).message}`);
    }
}

/**
 * 检查是否可以发送 OTP
 * @param email 邮箱地址
 * @param type OTP 类型
 * @returns 是否可以发送及剩余时间
 */
export async function checkOTPRateLimit(
    email: string,
    type: `${EmailOTPType}`,
): Promise<sendOTPResponse> {
    const key = `${OTP_RATE_LIMIT_KEY_PREFIX}${type}:${email}`;
    const rateLimit = authConfig.mails?.OTP?.rateLimit ?? 60;
    try {
        const redis = getRedisClient(serverIncs.redis);
        const lastSendTime = await redis.get(key);

        if (!lastSendTime) return { canSend: true, message: "可以发送" };

        const now = Date.now();
        const lastTime = Number.parseInt(lastSendTime, 10);
        const elapsed = Math.floor((now - lastTime) / 1000);
        const remainingTime = rateLimit - elapsed;

        if (remainingTime > 0) {
            return {
                canSend: false,
                remainingTime,
                message: "发送过于频繁，请稍后再试",
                nextSendTime: lastTime + rateLimit * 1000,
            };
        }

        return { canSend: true, message: "可以发送" };
    } catch (_error) {
        console.error(_error);
        // 如果 Redis 失败，允许发送（降级策略）
        return { canSend: true, message: "可以发送" };
    }
}

/**
 * 记录 OTP 发送时间
 * @param email 邮箱地址
 * @param type OTP 类型
 */
export async function recordOTPSendTime(email: string, type: string): Promise<void> {
    const key = `${OTP_RATE_LIMIT_KEY_PREFIX}${type}:${email}`;

    try {
        const redis = getRedisClient(serverIncs.redis);
        const now = Date.now();
        await redis.setex(key, authConfig.mails?.OTP?.rateLimit ?? 60, now.toString());
    } catch (error) {
        console.error("记录 OTP 发送时间失败:", error);
    }
}

/**
 * 获取 OTP 发送状态（用于页面加载时初始化）
 * @param email 邮箱地址
 * @param type OTP 类型
 * @returns 发送状态
 */
export async function getOTPSendStatus(
    credential: string,
    type: `${EmailOTPType}`,
): Promise<sendOTPResponse> {
    const user = await queryUserByUsernameOrEmail(credential);
    if (isNil(user)) return { canSend: false, message: "用户不存在" };
    const result = await checkOTPRateLimit(user.email, type);
    return {
        ...result,
        message: result.canSend ? "可以发送" : `请等待 ${result.remainingTime} 秒`,
    };
}
