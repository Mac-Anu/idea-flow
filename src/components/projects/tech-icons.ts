import type { SimpleIcon } from "simple-icons";
import {
    siTypescript,
    siJavascript,
    siReact,
    siNextdotjs,
    siVuedotjs,
    siNodedotjs,
    siTailwindcss,
    siPython,
    siPhp,
    siPostgresql,
    siMysql,
    siRedis,
    siDocker,
    siGit,
    siGithub,
    siHtml5,
    siCss,
    siVite,
    siNestjs,
    siExpress,
    siMongodb,
    siPrisma,
    siGraphql,
    siTrpc,
    siLaravel,
    siGo,
    siRust,
    siVercel,
    siFigma,
    siLinux,
    siNginx,
    siTensorflow,
    siLangchain,
    siWebpack,
    siSass,
    siBootstrap,
    siJest,
    siVitest,
    siElectron,
    siFlutter,
    siSwift,
    siKotlin,
    siSpringboot,
    siDjango,
    siFastapi,
    siSupabase,
    siFirebase,
    siCloudflare,
} from "simple-icons";

/**
 * 技术名 → simple-icons 图标的映射注册表。
 *
 * 用显式具名导入而非整包导入，让打包器只打进用到的几十个图标（整包近 3000 个）。
 * 查不到的技术降级为纯文字 badge（见 TechBadge 组件），所以这里不必穷举。
 *
 * key 已规范化：全小写、去掉点/空格/横线（如 "Next.js"、"next js"、"NEXT-JS" 都归一为 "nextjs"）。
 */
const ICON_REGISTRY: Record<string, SimpleIcon> = {
    typescript: siTypescript,
    ts: siTypescript,
    javascript: siJavascript,
    js: siJavascript,
    react: siReact,
    reactjs: siReact,
    nextjs: siNextdotjs,
    next: siNextdotjs,
    vue: siVuedotjs,
    vuejs: siVuedotjs,
    nodejs: siNodedotjs,
    node: siNodedotjs,
    tailwindcss: siTailwindcss,
    tailwind: siTailwindcss,
    python: siPython,
    php: siPhp,
    postgresql: siPostgresql,
    postgres: siPostgresql,
    pgsql: siPostgresql,
    mysql: siMysql,
    redis: siRedis,
    docker: siDocker,
    git: siGit,
    github: siGithub,
    html: siHtml5,
    html5: siHtml5,
    css: siCss,
    css3: siCss,
    vite: siVite,
    nestjs: siNestjs,
    nest: siNestjs,
    express: siExpress,
    expressjs: siExpress,
    mongodb: siMongodb,
    mongo: siMongodb,
    prisma: siPrisma,
    graphql: siGraphql,
    trpc: siTrpc,
    laravel: siLaravel,
    go: siGo,
    golang: siGo,
    rust: siRust,
    vercel: siVercel,
    figma: siFigma,
    linux: siLinux,
    nginx: siNginx,
    tensorflow: siTensorflow,
    langchain: siLangchain,
    webpack: siWebpack,
    sass: siSass,
    scss: siSass,
    bootstrap: siBootstrap,
    jest: siJest,
    vitest: siVitest,
    electron: siElectron,
    flutter: siFlutter,
    swift: siSwift,
    kotlin: siKotlin,
    springboot: siSpringboot,
    spring: siSpringboot,
    django: siDjango,
    fastapi: siFastapi,
    supabase: siSupabase,
    firebase: siFirebase,
    cloudflare: siCloudflare,
};

/** 规范化技术名：小写并去掉非字母数字字符，用于查表 */
const normalize = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * 按技术名查找 simple-icons 图标，查不到返回 null（调用方降级为文字 badge）。
 */
export const getTechIcon = (name: string): SimpleIcon | null => {
    return ICON_REGISTRY[normalize(name)] ?? null;
};

/**
 * 为没有图标的技术名生成一个稳定的色相（同名每次同色，不随机跳变）。
 * 返回 HSL 色相值 0–359。
 */
export const techColorHue = (name: string): number => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return hash % 360;
};
