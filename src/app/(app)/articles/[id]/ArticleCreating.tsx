"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/hono";

/**
 * 乐观导航：文章还在后台创建中，轮询直到可读，然后刷新页面
 */
export function ArticleCreating({ id }: { id: string }) {
    const router = useRouter();

    useEffect(() => {
        let attempts = 0;
        const MAX_ATTEMPTS = 20; // 最多等 4 秒

        const interval = setInterval(async () => {
            attempts++;
            try {
                const res = await client.api.articles[":item"].$get({ param: { item: id } });
                if (res.ok) {
                    clearInterval(interval);
                    router.refresh();
                }
            } catch {}

            if (attempts >= MAX_ATTEMPTS) {
                clearInterval(interval);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [id, router]);

    return (
        <div className="mx-auto max-w-4xl animate-pulse">
            {/* Header skeleton */}
            <div className="mb-8 border-b border-black/6 pb-8">
                <div className="h-3 w-24 rounded-full bg-black/8" />
                <div className="mt-3 h-8 w-72 rounded-xl bg-black/8" />
                <div className="mt-3 h-4 w-96 rounded-lg bg-black/6" />
            </div>

            {/* Editor card skeleton */}
            <div className="rounded-[28px] border border-black/5 bg-white/70 px-10 py-10 shadow-[0_18px_40px_rgba(33,24,14,0.04)]">
                {/* Title skeleton */}
                <div className="mb-6 h-10 w-1/2 rounded-xl bg-black/6" />

                {/* Tags skeleton */}
                <div className="mb-8 flex gap-3">
                    <div className="h-6 w-16 rounded-full bg-black/6" />
                    <div className="h-6 w-16 rounded-full bg-black/6" />
                </div>

                {/* Content skeleton lines */}
                <div className="space-y-3">
                    <div className="h-4 w-full rounded-lg bg-black/5" />
                    <div className="h-4 w-5/6 rounded-lg bg-black/5" />
                    <div className="h-4 w-4/6 rounded-lg bg-black/5" />
                </div>
            </div>
        </div>
    );
}
