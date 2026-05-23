import { Context, Next } from "hono";

// 简单的内存限流器，适用于单机部署
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

export const rateLimiterMiddleware = async (c: Context, next: Next) => {
    // 尝试获取用户 IP（兼容常见反向代理如 Nginx, Vercel 等）
    const ip = c.req.header("x-forwarded-for") || "unknown_ip";
    
    const limit = 10; // 每分钟最多 10 次请求
    const windowMs = 60 * 1000; // 1 分钟窗口期
    
    const now = Date.now();
    const record = rateLimitCache.get(ip);
    
    if (record && record.resetTime > now) {
        if (record.count >= limit) {
            return c.json({ 
                success: false,
                message: "请求太频繁啦，请休息一分钟再试哦！" 
            }, 429);
        }
        record.count += 1;
    } else {
        rateLimitCache.set(ip, { count: 1, resetTime: now + windowMs });
    }
    
    // 顺手清理一下过期的内存缓存（防止内存泄漏）
    if (Math.random() < 0.1) {
        for (const [key, value] of rateLimitCache.entries()) {
            if (value.resetTime <= now) {
                rateLimitCache.delete(key);
            }
        }
    }
    
    await next();
};

export const refererCheckMiddleware = async (c: Context, next: Next) => {
    // 开发环境下不严格校验
    if (process.env.NODE_ENV === "development") {
        return await next();
    }

    const referer = c.req.header("referer") || "";
    const origin = c.req.header("origin") || "";
    const allowedUrl = process.env.BETTER_AUTH_URL || "";

    // 如果未配置 allowedUrl，直接放行
    if (!allowedUrl) {
        return await next();
    }

    // 只要 origin 或 referer 是从我们的网站发出的，就放行
    if (origin.startsWith(allowedUrl) || referer.startsWith(allowedUrl)) {
        return await next();
    }

    // 否则直接拦截防盗刷
    return c.json({ 
        success: false,
        message: "禁止从非法来源调用此 API！" 
    }, 403);
};
