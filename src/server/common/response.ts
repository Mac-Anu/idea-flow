import type { ZodType } from "zod";
import { resolver } from "hono-openapi";
import { errorSchema } from "./schema";

/**
 * 创建OpenAPI响应信息的基础函数
 */
export const createResponse = <T extends ZodType, S extends number>(
    schema: T,
    status: S,
    description: string,
) => {
    return {
        [status]: {
            description,
            content: { "application/json": { schema: resolver(schema) } },
        },
    };
};

/**
 * 创建成功响应 (HTTP 200)
 */
export const createSuccessResponse = <T extends ZodType>(schema: T, description?: string) => {
    return createResponse(schema, 200, description ?? "请求成功");
};

/**
 * 创建资源成功响应 (HTTP 201)
 */
export const create201SuccessResponse = <T extends ZodType>(schema: T, description?: string) => {
    return createResponse(schema, 201, description ?? "创建成功");
};

/**
 * 基于 errorSchema 统一格式的错误响应创建方法
 */
export const createErrorResponse = <S extends number>(description: string, status: S) => {
    return {
        [status]: {
            description,
            content: { "application/json": { schema: resolver(errorSchema) } },
        },
    };
};

// 预定义通用错误响应工厂函数
export const createValidatorErrorResponse = (msg?: string) =>
    createErrorResponse(msg ?? "请求数据校验失败", 400);
export const createNotFoundErrorResponse = (msg?: string) =>
    createErrorResponse(msg ?? "资源不存在", 404);
export const createServerErrorResponse = (msg?: string) =>
    createErrorResponse(msg ?? "服务器错误", 500);

/**
 * 创建用户未认证响应信息
 * @param description
 */
export const createUnauthorizedErrorResponse = (description?: string) => {
    return createErrorResponse(description ?? '用户未认证', 401);
};
