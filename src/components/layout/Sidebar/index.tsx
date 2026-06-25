"use client";

import {
    Search,
    Trash2,
    Plus,
    FileText,
    MoreHorizontal,
    Home,
    FolderGit2,
    UserCog,
    Sun,
    Moon,
    Bot,
    ShieldAlert,
} from "lucide-react";
import { useTheme } from "next-themes";
import { AllArticlesModal } from "./modals/AllArticlesModal";
import { SearchModal } from "./modals/SearchModal";
import { TrashModal } from "./modals/TrashModal";
import { UserMenu } from "./UserMenu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Article } from "@/server/articles/type";
import { useSidebar } from "./hooks";
import { useAbility } from "@/components/auth/rbac";

export const Sidebar = ({ articles }: { articles: Article[] }) => {
    const ability = useAbility();
    const {
        pathname,
        isAllModalOpen,
        setIsAllModalOpen,
        isSearchOpen,
        setIsSearchOpen,
        isTrashOpen,
        setIsTrashOpen,
        isCreating,
        sidebarRef,
        activeArticleId,
        activeArticleTitle,
        DISPLAY_LIMIT,
        displayedArticles,
        hasMore,
        handleNewArticle,
        handleDeleteArticle,
    } = useSidebar(articles);

    return (
        <aside ref={sidebarRef} className="sticky top-0 z-50 flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-border bg-card/60 backdrop-blur-xl">
            <div className="border-b border-border px-5 pb-5 pt-6">
                <UserMenu />
            </div>

            <div className="px-4 pt-4">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground shadow-sm transition hover:border-border hover:bg-accent"
                >
                    <div className="flex items-center gap-3">
                        <Search size={15} className="opacity-60" />
                        <span className="font-medium">搜索文章</span>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground">
                        ⌘ K
                    </span>
                </button>
            </div>
            {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}

            <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Writing Desk</p>
                    <p className="mt-1 text-sm font-medium text-foreground">文章草稿与作品集</p>
                </div>
                {ability?.can("create", "Article") && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNewArticle}
                        disabled={isCreating}
                        className="h-9 w-9 rounded-xl border border-border bg-card/50 text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                        title="新建页面"
                    >
                        {isCreating ? (
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            <Plus size={15} />
                        )}
                    </Button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-4 pb-4">
                {articles.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
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
                            const articleSubject = {
                                __caslSubjectType__: "Article" as const,
                                userId: article.userId,
                            };
                            return (
                                <Link key={article.id} href={`/articles/${article.id}`}>
                                    <div
                                        className={cn(
                                            "group rounded-2xl border px-3.5 py-3 transition-all duration-200",
                                            isActive
                                                ? "border-primary/50 bg-accent/30 shadow-sm"
                                                : "border-transparent bg-transparent hover:border-border hover:bg-accent/20",
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm",
                                                    isActive
                                                        ? "border-primary/50 bg-primary/20 text-primary"
                                                        : "border-border bg-card/50 text-muted-foreground group-hover:text-foreground",
                                                )}
                                            >
                                                <FileText size={15} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        "truncate text-sm font-medium flex items-center gap-2",
                                                        isActive ? "text-foreground" : "text-muted-foreground",
                                                    )}
                                                >
                                                    <span className="truncate">{displayTitle}</span>
                                                    {article.isAIGenerated && (
                                                        <span className="shrink-0 inline-flex items-center rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/15 dark:text-primary dark:ring-primary/30" title="由 AI 抓取生成">
                                                            <Bot size={10} className="mr-0.5" />
                                                            AI
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground/70">
                                                    {isActive ? "当前编辑中" : "点击查看与编辑"}
                                                </p>
                                             </div>
                                            {ability?.can("delete", articleSubject) && (
                                                <button
                                                    onClick={(e) => handleDeleteArticle(e, article.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 self-center"
                                                    title="移至回收站"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {hasMore && (
                            <Button
                                variant="ghost"
                                onClick={() => setIsAllModalOpen(true)}
                                className="mt-2 h-auto w-full justify-start gap-3 rounded-2xl border border-dashed border-border px-3.5 py-3 text-sm font-normal text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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
            {isTrashOpen && (
                <TrashModal onClose={() => setIsTrashOpen(false)} sidebarRef={sidebarRef} />
            )}

            <div className="border-t border-border px-4 py-4">
                <div className="space-y-1">
                    <SidebarLink icon={<Home size={15} />} label="返回首页" href="/" />
                    <SidebarLink icon={<FolderGit2 size={15} />} label="项目管理" href="/manage/projects" />
                    <SidebarLink icon={<UserCog size={15} />} label="站点 Profile" href="/manage/profile" />
                    <button
                        onClick={() => setIsTrashOpen(true)}
                        className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                    >
                        <span className="shrink-0 opacity-70"><Trash2 size={15} /></span>
                        <span className="truncate">回收站</span>
                    </button>
                    <SidebarThemeToggle />
                    {ability?.can('manage', 'all') && (
                        <SidebarLink icon={<ShieldAlert size={15} className="text-destructive" />} label="系统控制台" href="/admin" />
                    )}
                </div>
            </div>
        </aside>
    );
};

function SidebarThemeToggle() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
        >
            <span className="shrink-0 opacity-70">
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            <span className="truncate">{isDark ? "切换白天模式" : "切换夜间模式"}</span>
        </button>
    );
}

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
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground">
                <span className="shrink-0 opacity-70">{icon}</span>
                <span className="truncate">{label}</span>
            </div>
        </Link>
    );
}
