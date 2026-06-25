import { NextResponse, type NextRequest } from "next/server";
import { isNil } from "lodash";

import { authConfig } from "@/config/auth";

export const config = {
    // 注意：Next.js 的中间件默认强制要求 Edge Runtime。如果强行写 runtime: 'nodejs' 通常会导致编译报错。
    // 如果老师的代码里有这行且能跑，可能是特定的实验性配置。为了安全起见，这里我先帮你注释掉。
    // runtime: 'nodejs',
    matcher: [
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|bmp|tiff|woff|woff2|ttf|eot|otf|css|scss|sass|less|js|mjs|pdf|doc|docx|txt|md|zip|rar|7z|tar|gz|mp3|mp4|avi|mov|wav|flac)$|sitemap\\.xml|robots\\.txt|manifest\\.json|sw\\.js|workbox-.*\\.js).*)",
    ],
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. 需要认证的页面路由 (访问这些页面必须登录)
    const protectedRoutes = authConfig.protectedPages || [];
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        return authPageProtectedHandler(request);
    }

    // 2. 认证专用的路由 (访问这些页面必须未登录)
    if (
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up") ||
        pathname.startsWith("/forget-password")
    ) {
        return authSignInHandler(request);
    }

    // 默认处理
    return NextResponse.next();
}

// 同步提取 cookie 验证，避免每次路由跳转都去 fetch 后端 API，极大提升流畅度
const checkIsAuthenticated = (request: NextRequest) => {
    const sessionCookie = 
        request.cookies.get("better-auth.session_token")?.value || 
        request.cookies.get("__Secure-better-auth.session_token")?.value;
    return !!sessionCookie;
};

// 认证路由处理函数：处理必须要登录才能访问的页面
const authPageProtectedHandler = (request: NextRequest) => {
    try {
        const isAuthenticated = checkIsAuthenticated(request);

        if (!isAuthenticated) {
            // 未登录，创建跳转到 sign-in 的 URL 并添加回调参数
            const loginUrl = new URL("/sign-in", request.url);
            loginUrl.searchParams.set(
                "callbackUrl",
                request.nextUrl.pathname + request.nextUrl.search,
            );
            return NextResponse.redirect(loginUrl);
        }

        // 用户已认证，继续处理请求
        return NextResponse.next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        // 发生错误时也重定向到登录页面，同样添加回调参数
        const loginUrl = new URL("/sign-in", request.url);
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
        return NextResponse.redirect(loginUrl);
    }
};

// 登录/注册页面处理函数：处理已经登录就不能再访问的页面
const authSignInHandler = (request: NextRequest) => {
    try {
        // 如果是从业务组件被踢回来的（带着 expired 标志）
        const isExpired = request.nextUrl.searchParams.get("expired") === "1";
        
        if (isExpired) {
            // 放行到登录页，并在这个响应中强行抹除浏览器残留的死 Cookie
            const response = NextResponse.next();
            response.cookies.delete("better-auth.session_token");
            response.cookies.delete("__Secure-better-auth.session_token");
            return response;
        }

        const isAuthenticated = checkIsAuthenticated(request);

        if (isAuthenticated) {
            const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");

            // 带着 callbackUrl 来的，说明是「刚登录成功、要回原来想去的页」这种正常流程，放心跳。
            if (!isNil(callbackUrl)) {
                return NextResponse.redirect(new URL(callbackUrl, request.url));
            }

            // 没有 callbackUrl，却又「看起来已登录」还主动来点登录页——这本身就可疑：
            // 最常见的就是浏览器里揣着一张已过期的死 Cookie。middleware 为了快只查 Cookie 在不在、
            // 不验真假，会把这种用户误判成已登录，无脑弹回首页，结果人永远进不来登录页（死循环）。
            // 这里不再无脑弹首页，而是放行登录页 + 顺手抹掉这张死 Cookie，给用户一条活路。
            const response = NextResponse.next();
            response.cookies.delete("better-auth.session_token");
            response.cookies.delete("__Secure-better-auth.session_token");
            return response;
        }

        // 用户未认证，继续处理请求 (允许看登录页/注册页)
        return NextResponse.next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return NextResponse.next();
    }
};
