"use client";

import { useEffect, useState, useRef } from "react";
import { client } from "@/lib/hono";
import type { Article } from "@/server/articles/type";
import { ArticleEditor } from "./ArticleEditor";

/**
 * 文章编辑器的数据加载层（客户端获取）
 * - 点击即刻显示骨架屏，无需等待服务器
 * - 支持乐观导航：若文章还在创建中（404），自动轮询直到可读
 */
export function ArticleEditorWrapper({ id }: { id: string }) {
    const [article, setArticle] = useState<Article | null>(null);
    const [notFound, setNotFound] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setArticle(null);
        setNotFound(false);
        let pollCount = 0;
        const MAX_POLLS = 25; // 最多轮询 5 秒

        let isMounted = true;
        
        const tryFetch = async () => {
            if (!isMounted) return;
            try {
                const res = await client.api.articles[":item"].$get({
                    param: { item: id },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setArticle(data.article as Article);
                    return; // 成功，结束轮询
                }
                if (res.status === 404 && pollCount < MAX_POLLS) {
                    pollCount++;
                    // 等待 500ms 后再次轮询（避免并发耗尽连接池）
                    if (isMounted) {
                        intervalRef.current = setTimeout(tryFetch, 500);
                    }
                } else {
                    if (isMounted) setNotFound(true);
                }
            } catch {
                if (isMounted && pollCount < MAX_POLLS) {
                    pollCount++;
                    intervalRef.current = setTimeout(tryFetch, 500);
                } else {
                    if (isMounted) setNotFound(true);
                }
            }
        };

        tryFetch();

        return () => {
            isMounted = false;
            if (intervalRef.current) clearTimeout(intervalRef.current);
        };
    }, [id]);

    // 加载中骨架屏
    if (!article && !notFound) {
        return (
            <div className="mx-auto max-w-4xl animate-pulse">
                <div className="mb-8 border-b border-black/6 pb-8">
                    <div className="h-3 w-24 rounded-full bg-black/8" />
                    <div className="mt-3 h-8 w-72 rounded-xl bg-black/8" />
                    <div className="mt-3 h-4 w-96 rounded-lg bg-black/6" />
                </div>
                <div className="rounded-[28px] border border-black/5 bg-white/70 px-10 py-10 shadow-[0_18px_40px_rgba(33,24,14,0.04)]">
                    <div className="mb-6 h-10 w-1/2 rounded-xl bg-black/6" />
                    <div className="mb-8 flex gap-3">
                        <div className="h-6 w-16 rounded-full bg-black/6" />
                        <div className="h-6 w-16 rounded-full bg-black/6" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 w-full rounded-lg bg-black/5" />
                        <div className="h-4 w-5/6 rounded-lg bg-black/5" />
                        <div className="h-4 w-4/6 rounded-lg bg-black/5" />
                    </div>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex h-96 items-center justify-center text-[#9b8f80]">
                文章不存在或已被删除
            </div>
        );
    }

    return <ArticleEditor article={article!} />;
}
