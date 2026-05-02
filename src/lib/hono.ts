import { hc } from "hono/client";
import type { AppType } from "@/server/main";
import { getBaseUrl } from "./app";
import { Hono } from "hono";
import { appConfig } from "@/config/app";

export const client = hc<AppType>(getBaseUrl());

export const buildClient = <T extends Hono<any, any, any>>(route?: string) =>
    hc<T>(`${getBaseUrl()}${appConfig.apiPath}${route ?? ""}`, {});

export const fetchApi = async <
    T extends Hono<any, any, any>,
    F extends (c: C) => Promise<any>,
    C = ReturnType<typeof hc<T>>,
>(
    client: C,
    run: F,
): Promise<ReturnType<F>> => {
    const result = await run(client);
    return result;
};
