"use client";

import {
    Search,
    Settings,
    Trash2,
    Plus,
    ChevronDown,
    FileText,
    MoreHorizontal,
    PenSquare,
} from "lucide-react";
import { useState } from "react";
import { AllArticlesModal } from "./modals/AllArticlesModal";
import { SearchModal } from "./modals/SearchModal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useArticleStore } from "@/components/article/store";
import { client } from "@/lib/hono";
import { Button } from "@/components/ui/button";
import type { Article } from "@/server/articles/type";

export const Sidebar = ({ articles }: { articles: Article[] }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isAllModalOpen, setIsAllModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const activeArticleId = useArticleStore((state) => state.activeArticleId);
    const activeArticleTitle = useArticleStore((state) => state.activeArticleTitle);

    const DISPLAY_LIMIT = 10;
    const displayedArticles = articles.slice(0, DISPLAY_LIMIT);
    const hasMore = articles.length > DISPLAY_LIMIT;

    const handleNewArticle = async () => {
        if (isCreating) return;
        setIsCreating(true);

        // 在非 HTTPS 环境下（如直接用 IP 访问），crypto.randomUUID() 不可用，需要自己写一个降级方案
        const generateUUID = () => {
            if (typeof crypto !== "undefined" && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        const newId = generateUUID();
        router.push(`/articles/${newId}`);

        // 2. 后台静默创建，完成后刷新侧边栏文章列表
        try {
            await client.api.articles.$post({
                json: { id: newId, title: "", content: "" },
            });
            router.refresh();
        } catch (error) {
            console.log("新建文章失败", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <aside className="sticky top-0 z-50 flex h-[calc(100vh-2rem)] w-[300px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-black/5 bg-[rgba(255,251,245,0.88)] shadow-[0_20px_50px_rgba(33,24,14,0.04)] backdrop-blur-sm">
            <div className="border-b border-black/5 px-5 pb-5 pt-6">
                <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f1d1a] text-white shadow-sm">
                            <PenSquare size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9b8f80]">Personal Brand</p>
                            <span className="text-sm font-semibold text-[#1f1d1a]">IdeaFlow Blog</span>
                        </div>
                    </div>
                    <ChevronDown size={15} className="text-[#a89d90]" />
                </div>

                <div className="mt-4 rounded-2xl border border-[#eadfcb] bg-[#f6ecdc] px-4 py-4 text-sm text-[#5e5448]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9d7d3c]">
                        求职展示建议
                    </p>
                    <p className="mt-2 leading-6">
                        优先整理项目复盘、技术拆解和学习总结，让你的博客看起来像持续输出的作品集。
                    </p>
                </div>
            </div>

            <div className="px-4 pt-4">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-white/80 px-4 py-3 text-sm text-[#6b6258] shadow-sm transition hover:border-[#dccfb8] hover:bg-white"
                >
                    <div className="flex items-center gap-3">
                        <Search size={15} className="opacity-60" />
                        <span className="font-medium">搜索文章</span>
                    </div>
                    <span className="rounded-md bg-[#f3ead8] px-2 py-0.5 text-[10px] font-medium tracking-wider text-[#8a6a2f]">
                        ⌘ K
                    </span>
                </button>
            </div>
            {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}

            <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#9b8f80]">Writing Desk</p>
                    <p className="mt-1 text-sm font-medium text-[#3a342e]">文章草稿与作品集</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewArticle}
                    disabled={isCreating}
                    className="h-9 w-9 rounded-xl border border-black/5 bg-white/80 text-[#7b6d5b] shadow-sm hover:bg-[#f3ead8] hover:text-[#8a6a2f] disabled:opacity-50"
                    title="新建页面"
                >
                    {isCreating ? (
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Plus size={15} />
                    )}
                </Button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 pb-4">
                {articles.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#dfd3bf] px-4 py-8 text-center text-sm text-[#8b8175]">
                        还没有文章，点右上角开始写第一篇作品。
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayedArticles.map((article) => {
                            const isActive = pathname === `/articles/${article.id}`;
                            const displayTitle =
                                article.id === activeArticleId
                                    ? activeArticleTitle || "新页面"
                                    : article.title || "新页面";
                            return (
                                <Link key={article.id} href={`/articles/${article.id}`}>
                                    <div
                                        className={cn(
                                            "group rounded-2xl border px-3.5 py-3 transition-all duration-200",
                                            isActive
                                                ? "border-[#dec9a0] bg-[#fff8ec] shadow-sm"
                                                : "border-transparent bg-transparent hover:border-black/5 hover:bg-white/75",
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm",
                                                    isActive
                                                        ? "border-[#ead7b2] bg-[#f3ead8] text-[#8a6a2f]"
                                                        : "border-black/5 bg-white/80 text-[#9b8f80] group-hover:text-[#6b6258]",
                                                )}
                                            >
                                                <FileText size={15} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        "truncate text-sm font-medium",
                                                        isActive ? "text-[#2d261f]" : "text-[#5c544c]",
                                                    )}
                                                >
                                                    {displayTitle}
                                                </p>
                                                <p className="mt-1 text-xs text-[#9b8f80]">
                                                    {isActive ? "当前编辑中" : "点击查看与编辑"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {hasMore && (
                            <Button
                                variant="ghost"
                                onClick={() => setIsAllModalOpen(true)}
                                className="mt-2 h-auto w-full justify-start gap-3 rounded-2xl border border-dashed border-[#d9ccb7] px-3.5 py-3 text-sm font-normal text-[#8b8175] hover:bg-white/70 hover:text-[#5f564d]"
                            >
                                <MoreHorizontal size={15} className="shrink-0 opacity-60" />
                                <span>查看更多 {articles.length - DISPLAY_LIMIT} 篇文章</span>
                            </Button>
                        )}
                    </div>
                )}
            </nav>

            {isAllModalOpen && (
                <AllArticlesModal articles={articles} onClose={() => setIsAllModalOpen(false)} />
            )}

            <div className="border-t border-black/5 px-4 py-4">
                <div className="space-y-1">
                    <SidebarLink icon={<Trash2 size={15} />} label="回收站" href="#" />
                    <SidebarLink icon={<Settings size={15} />} label="设置" href="#" />
                </div>
            </div>
        </aside>
    );
};

function SidebarLink({
    icon,
    label,
    href,
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
}) {
    return (
        <Link href={href}>
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#6b6258] transition hover:bg-white/80 hover:text-[#2d261f]">
                <span className="shrink-0 opacity-70">{icon}</span>
                <span className="truncate">{label}</span>
            </div>
        </Link>
    );
}