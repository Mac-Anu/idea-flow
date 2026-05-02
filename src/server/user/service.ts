import { isNil } from "lodash";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { SignUpRequest } from "./type";

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
        return null;
    }

    // 使用Better Auth的内部验证方法
    const result = await auth.api.signInEmail({
        body: {
            // BetterAuth 底层必须用 email 登录，但我们通过上面的查找把 credential 翻译成了 email
            email: existingUser.email,
            password,
        },
    });

    return result;
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
    const { username, email, password } = data;

    // 1. 检查邮箱是否已被注册
    const existingUserByEmail = await queryUserByEmail(email);
    if (existingUserByEmail) {
        return { result: false, message: "邮箱已被使用" };
    }

    // 2. 检查用户名是否已被占用
    const existingUserByUsername = await queryUserByUsername(username);
    if (existingUserByUsername) {
        return { result: false, message: "用户名已被使用" };
    }

    // 3. 两项预检通过，调用 Better-Auth 创建用户
    const res = await auth.api.signUpEmail({
        body: {
            name: username, // 显示名称
            username, // 用户名（username 插件专用字段）
            email,
            password,
        },
    });

    return { result: true, user: res.user };
};

/**
 * 验证码发送桥梁函数 (目前还是占位符，稍后我们会实现真正的邮件发送逻辑)
 */
export const sendOTPHandler = async (data: { email: string; code: string }, type: string) => {
    console.log(`[发送邮件模拟] 即将发送 ${type} 类型的验证码 ${data.code} 给邮箱 ${data.email}`);
    // 稍后我们会在这里调用 sendSmtpMail
};
