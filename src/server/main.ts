import { articleApi } from "./articles/route";
import { createHonoApp } from "./common/app";
import { swaggerUI } from "@hono/swagger-ui";
import { Scalar } from "@scalar/hono-api-reference";
import { openAPIRouteHandler } from "hono-openapi";
import { authRoutes } from "./user/routes/auth";
import { createErrorResult } from "./common/error";

const app = createHonoApp().basePath("/api");
app.get("/", (c) => c.text("IdeaFlow API"));
app.notFound((c) => c.json(createErrorResult("路由不存在", null, 404), 404));
app.onError((err, c) => {
    console.error(`[全局异常] ${err.message}`);
    return c.json(createErrorResult("服务器内部错误", err, 500), 500);
});
const routes = app.route("/articles", articleApi).route("/auth", authRoutes);

// Swagger 接口文档
app.get("/swagger", swaggerUI({ url: "/api/openapi" }));
// Scalar 接口文档 (Saturn 主题)
app.get("/docs", Scalar({ theme: "saturn", url: "/api/openapi" }));
// OpenAPI 规范端点
app.get(
    "/openapi",
    openAPIRouteHandler(app, {
        documentation: {
            info: {
                title: "IdeaFlow API",
                version: "1.0.0",
                description: "IdeaFlow 项目的后端 API 接口文档",
            },
        },
    }),
);

import { beforeServer } from "./common/app";

// 包装成异步初始化逻辑
export const serverInit = async () => {
    await beforeServer();
    return { app, routes };
};

export const serverRPC = serverInit();

type AppType = typeof routes;
export { app, type AppType };
