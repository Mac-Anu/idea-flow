import type { AppConfig } from "@/lib/types";

export const appConfig: AppConfig = {
    appName: "idea flow",
    baseUrl: typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
    apiPath: process.env.NEXT_PUBLIC_API_PATH || "/api",
    locale: "zh-cn",
    timezone: "Asia/Shanghai",
};
