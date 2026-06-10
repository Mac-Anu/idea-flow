import { Sparkles, ArrowRight, Calendar, Tag, Clock } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { queryPublishedArticles } from "@/server/articles/service";
import { stripHtml, formatDate, estimateReadTime, collectTags } from "@/lib/article";
import { ArticleList } from "@/components/home/ArticleList";
import { HomeHero } from "@/components/home/HomeHero";

import type { Article } from "@/server/articles/type";

export default async function Home(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const tag = typeof searchParams?.tag === 'string' ? searchParams.tag : null;

    let articles: Article[] = [];
    try {
        articles = await queryPublishedArticles();
    } catch (e) {
        console.warn("Failed to fetch articles during build/SSR. This is expected in CI environments without DB access.", e);
    }

    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const user = session?.user;

    const allTags = collectTags(articles);
    const featured = !tag && articles.length > 0 ? articles[0] : null;
    const restArticles = featured ? articles.slice(1) : articles;

    // ========== 视图层 ==========
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/website-logo-flat.svg" alt="创想流 Logo" className="w-8 h-8 rounded-xl shadow-sm" />
                        <span className="text-lg font-semibold tracking-tight text-foreground">创想流</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <ThemeToggle />
                        {user ? (
                            <>
                                <Link href="/articles" className="hidden sm:block">
                                    <button className="px-4 py-2 bg-transparent text-muted-foreground text-sm font-medium rounded-full hover:bg-muted hover:text-foreground border border-transparent transition-all whitespace-nowrap">
                                        {user.displayUsername || user.username || user.name || "User"}
                                    </button>
                                </Link>
                                <Link href="/articles">
                                    <button className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:brightness-110 transition-all shadow-sm whitespace-nowrap">
                                        开始写作
                                    </button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/sign-in" className="hidden sm:block">
                                    <button className="px-4 py-2 bg-transparent text-muted-foreground text-sm font-medium rounded-full hover:bg-muted hover:text-foreground border border-transparent transition-all whitespace-nowrap">
                                        请登录
                                    </button>
                                </Link>
                                <Link href="/sign-in">
                                    <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:brightness-110 transition-all shadow-sm whitespace-nowrap">
                                        登录
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pt-28 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Hero */}
                    <HomeHero />

                    {articles.length > 0 ? (
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* 左侧：主内容区 */}
                            <div className="flex-1 min-w-0">
                                {/* 特色文章 */}
                                {featured && (
                                    <Link href={`/blog/${featured.slug || featured.id}`} className="group block mb-10">
                                        <article className="relative p-8 rounded-[24px] border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                                            <div className="absolute top-6 right-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                                    <Sparkles className="w-3 h-3" />
                                                    {featured.isPinned ? "置顶" : "最新发布"}
                                                </span>
                                            </div>

                                            {featured.tags && featured.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4 pr-24 sm:pr-28">
                                                    {featured.tags.slice(0, 4).map((tag: string) => (
                                                        <span
                                                            key={tag}
                                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium"
                                                        >
                                                            <Tag className="w-2.5 h-2.5" />
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <h2 className="text-2xl md:text-3xl font-bold text-card-foreground mb-4 group-hover:text-primary transition-colors leading-tight pr-24 sm:pr-28">
                                                {featured.title}
                                            </h2>

                                            <p className="text-base text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                                                {stripHtml(featured.content).slice(0, 250)}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(featured.updatedAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {estimateReadTime(featured.content)} 分钟阅读
                                                    </span>
                                                </div>
                                                <span className="flex items-center gap-1.5 text-sm text-primary font-medium group-hover:gap-2.5 transition-all">
                                                    阅读全文
                                                    <ArrowRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </article>
                                    </Link>
                                )}

                                {/* 文章列表 */}
                                <ArticleList
                                    articles={restArticles}
                                    allTags={allTags}
                                    activeTag={tag}
                                />
                            </div>

                            {/* 右侧：侧边栏 */}
                            <aside className="w-full lg:w-[280px] shrink-0">
                                <div className="lg:sticky lg:top-24 space-y-8">
                                    {/* 统计概览 */}
                                    <div className="rounded-[20px] border border-border bg-card p-6">
                                        <h3 className="text-sm font-semibold text-foreground mb-4 tracking-wide">博客概览</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 rounded-xl bg-muted/50">
                                                <p className="text-2xl font-bold text-foreground">{articles.length}</p>
                                                <p className="text-xs text-muted-foreground mt-1">篇文章</p>
                                            </div>
                                            <div className="text-center p-3 rounded-xl bg-muted/50">
                                                <p className="text-2xl font-bold text-foreground">{allTags.length}</p>
                                                <p className="text-xs text-muted-foreground mt-1">个标签</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 标签云 */}
                                    {allTags.length > 0 && (
                                        <div className="rounded-[20px] border border-border bg-card p-6">
                                            <h3 className="text-sm font-semibold text-foreground mb-4 tracking-wide">标签</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {allTags.slice(0, 15).map((t) => (
                                                    <Link
                                                        key={t.name}
                                                        href={tag === t.name ? "/" : `/?tag=${t.name}`}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                                            tag === t.name
                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                : "border-border bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                                                        }`}
                                                    >
                                                        {t.name}
                                                        <span className={`text-[10px] ${tag === t.name ? 'opacity-80' : 'opacity-50'}`}>({t.count})</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center py-24">
                            <div className="relative mb-7">
                                <div className="absolute inset-0 -z-10 blur-2xl rounded-full bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] opacity-20" />
                                <div className="w-20 h-20 rounded-3xl bg-card border border-border flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-9 h-9 text-primary" />
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">空白，正是开始的地方</h2>
                            <p className="text-muted-foreground text-sm max-w-sm mb-7 leading-relaxed">
                                还没有发布任何文章。{user ? "现在就去写下第一篇灵感吧。" : "登录后即可撰写并发布你的第一篇作品。"}
                            </p>
                            <Link href={user ? "/articles" : "/sign-in"}>
                                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white text-sm font-medium shadow-sm hover:brightness-110 hover:scale-[1.02] transition-all">
                                    <Sparkles className="w-4 h-4" />
                                    {user ? "开始写作" : "登录开始"}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-border py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm font-medium text-muted-foreground">
                        © 2026 创想流. 探索、思考与沉淀
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="/articles" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">工作台</Link>
                        <a href="https://github.com/Mac-Anu" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">关于作者</a>
                        <a href="https://github.com/Mac-Anu" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
