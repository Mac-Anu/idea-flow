import { isNil } from "lodash";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { verification } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import { authConfig } from "@/config/auth";
import type { SignUpRequest, ResetPasswordRequest, sendOTPResponse } from "./type";
import { EmailOTPType } from "./constants";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { checkOTPRateLimit, recordOTPSendTime } from "./otp";
import { addOTPQueue } from "./queue";

type AuthUser = typeof auth.$Infer.Session.user;

/**
 * 获取当前用户会话信息
 */
export const getCurrentSession = async (request: Request) => {
    return await auth.api.getSession({
        headers: request.headers,
    });
};

/**
 * 用户登录 - 支持用户名或邮箱
 */
export const signIn = async (credential: string, password: string) => {
    // Drizzle 语法的查找：优先查找用户名或邮箱匹配的记录
    const [existingUser] = await db
        .select()
        .from(user)
        .where(or(eq(user.username, credential), eq(user.email, credential)));

    if (isNil(existingUser)) {
        return { error: 'USER_NOT_FOUND' };
    }

    try {
        // 使用Better Auth的内部验证方法
        const result = await auth.api.signInEmail({
            body: {
                // BetterAuth 底层必须用 email 登录，但我们通过上面的查找把 credential 翻译成了 email
                email: existingUser.email,
                password,
            },
        });
        return { success: true, data: result };
    } catch (e) {
        return { error: 'INVALID_PASSWORD' };
    }
};

/**
 * 用户登出
 */
export const signOut = async (request: Request) => {
    return await auth.api.signOut({
        headers: request.headers,
    });
};

/**
 * 根据邮箱地址查询用户
 */
export const queryUserByEmail = async (value: string) => {
    const [result] = await db.select().from(user).where(eq(user.email, value)).limit(1);
    return result;
};

/**
 * 根据用户名查询用户
 */
export const queryUserByUsername = async (value: string) => {
    const [result] = await db.select().from(user).where(eq(user.username, value)).limit(1);
    return result;
};

/**
 * 获取用户信息
 */
export const getUser = async (request: Request) => {
    const session = await getCurrentSession(request);
    return session?.user || null;
};

/**
 * 通过邮箱注册用户
 */
export const signUpByEmail = async (
    data: Omit<SignUpRequest, "validateType">,
): Promise<{ result: false; message: string } | { result: true; user: AuthUser }> => {
    const { username, email, password, otp } = data;

    const existingUserByEmail = await queryUserByEmail(email);
    if (existingUserByEmail) return { result: false, message: "邮箱已被使用" };

    const existingUserByUsername = await queryUserByUsername(username);
    if (existingUserByUsername) return { result: false, message: "用户名已被使用" };

    let res: { token: string; user: AuthUser } | undefined;

    try {
        res = (await auth.api.signUpEmail({
            body: {
                name: username,
                username,
                email,
                password,
            },
        })) as unknown as { token: string; user: AuthUser };

        const checkOtp = await auth.api.checkVerificationOTP({
            body: { email, type: "email-verification", otp },
        });

        if (!checkOtp.success) {
            await deleteUser(res.user.id);
            return { result: false, message: "验证码错误" };
        } else {
            await db
                .update(user)
                .set({ emailVerified: true })
                .where(eq(user.email, res.user.email));
        }
    } catch (error: any) {
        if (!isNil(res?.user?.id)) await deleteUser(res.user.id);
        return { result: false, ...error.body };
    }
    return { result: true, user: res.user };
};

/**
 * 通过邮箱重置用户密码
 * @param data
 */
export const resetPasswordByEmail = async (data: ResetPasswordRequest) => {
    const { credential, password, otp } = data;
    const existingUser = await queryUserByUsernameOrEmail(credential);
    if (isNil(existingUser)) {
        return { result: false, message: "用户不存在" };
    }
    const res = await auth.api.resetPasswordEmailOTP({
        body: {
            email: existingUser.email,
            otp,
            password,
        },
    });
    return { result: res.success, message: res.success ? "密码重置成功" : "密码重置失败" };
};

/**
 * 根据 用户名 或 邮箱 查询用户
 */
export const queryUserByUsernameOrEmail = async (credential: string) => {
    const [result] = await db
        .select()
        .from(user)
        .where(or(eq(user.username, credential), eq(user.email, credential)))
        .limit(1);
    return result;
};
/**
 * 根据 ID、用户名 或 邮箱 查询用户
 */
export const queryUser = async (credential: string) => {
    const [result] = await db
        .select()
        .from(user)
        .where(
            or(eq(user.id, credential), eq(user.username, credential), eq(user.email, credential)),
        )
        .limit(1);
    return result;
};
/**
 * 删除用户
 */
export const deleteUser = async (id: string) => {
    const existingUser = await queryUser(id);
    if (!isNil(existingUser)) {
        await db.delete(user).where(eq(user.id, id));
        return existingUser;
    }
    return null;
};

/**
 * 发送用户注册/重置密码邮件验证码
 * @param email
 */
export const sendOTP = async (
    email: string,
    type: `${EmailOTPType}`,
): Promise<{ result: sendOTPResponse; code: ContentfulStatusCode }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const limit = authConfig.mails?.OTP?.rateLimit ?? 60;

    // 检查发送频率
    const rateLimitCheck = await checkOTPRateLimit(normalizedEmail, type);

    if (!rateLimitCheck.canSend) {
        return {
            result: {
                message: `请在 ${rateLimitCheck.remainingTime} 秒后重试`,
                canSend: false,
                remainingTime: rateLimitCheck.remainingTime,
                nextSendTime: rateLimitCheck.nextSendTime,
            },
            code: 429,
        };
    }

    // 发送验证码
    if (type === "email-verification") {
        const identifier = `${type}-otp-${normalizedEmail}`;
        const otp = await auth.api
            .createVerificationOTP({
                body: {
                    email: normalizedEmail,
                    type,
                },
            })
            .catch(async () => {
                // 如果已经创建过，则先删除旧的，再重新创建
                // 注意这里替换成了 Drizzle 的语法，因为老师的原代码是 Prisma 的写法 db.verification.deleteMany
                await db.delete(verification).where(eq(verification.identifier, identifier));
                return await auth.api.createVerificationOTP({
                    body: { email: normalizedEmail, type },
                });
            });

        await addOTPQueue(normalizedEmail, otp, type);
    } else {
        await auth.api.sendVerificationOTP({
            body: {
                email: normalizedEmail,
                type,
            },
        });
    }

    // 记录发送时间
    await recordOTPSendTime(normalizedEmail, type);

    return {
        result: {
            message: "发送验证码完毕",
            canSend: false,
            remainingTime: limit,
            nextSendTime: Date.now() + limit * 1000,
        },
        code: 200,
    };
};
