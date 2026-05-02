import { auth, type AuthType } from "@/lib/auth";
import { createMiddleware } from "hono/factory";
import { isNil } from "lodash";
import { createErrorResult } from "../common/error";
// 保留这个类型，它能让你以后少加很多 as any
export type AuthEnv = {
    Variables: AuthType;
};
export const AuthProtectedMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
    try {
        // 1. 获取 Session
        const session = await auth.api.getSession({ headers: c.req.raw.headers });
        // 2. 检查用户
        if (isNil(session?.user)) {
            return c.json(createErrorResult("用户未认证"), 401);
        }
        // 3. 注入数据
        c.set("user", session.user);
        c.set("session", session.session);

        await next();
    } catch (error) {
        // 4. 异常处理
        return c.json(createErrorResult("认证服务异常", error), 500);
    }
});
