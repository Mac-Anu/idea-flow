import { Sparkles, ArrowRight, Calendar, Tag, Clock } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { queryPublishedArticles } from "@/server/articles/service";
import { stripHtml, formatDate, estimateReadTime, collectTags } from "@/lib/article";
import { ArticleList } from "@/components/home/ArticleList";
import { HomeHero } from "@/components/home/HomeHero";
import { GradientCover } from "@/components/home/GradientCover";

import type { Article } from "@/server/articles/type";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "博客 - 创想流",
    description: "技术探索、项目复盘与成长思考的文章合集。",
};

export const dynamic = "force-dynamic";

export default async function BlogListPage(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const tag = typeof searchParams?.tag === "string" ? searchParams.tag : null;

    let articles: Article[] = [];
    try {
        articles = await queryPublishedArticles();
    } catch (e) {
        console.warn("Failed to fetch articles during build/SSR. This is expected in CI environments without DB access.", e);
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    const allTags = collectTags(articles);
    const featured = !tag && articles.length > 0 ? articles[0] : null;
    const restArticles = featured ? articles.slice(1) : articles;

    return (
        <>
            {/* Hero */}
            <HomeHero />

            {articles.length > 0 ? (
                <div className="flex flex-col gap-10 lg:flex-row">
                    {/* 主内容区 */}
                    <div className="min-w-0 flex-1">
                        {featured && (
                            <Link href={`/blog/${featured.slug || featured.id}`} className="group mb-10 block">
                                <article className="relative overflow-hidden rounded-[24px] border border-white/10 p-8 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl">
                                    <div className="absolute inset-0">
                                        {featured.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={featured.imageUrl}
                                                alt={featured.title}
                                                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                            />
                                        ) : (
                                            <GradientCover
                                                seed={featured.slug || featured.id || featured.title}
                                                variant="featured"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/48 to-black/28" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-white/5" />
                                        <div className="absolute inset-0 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100" />
                                    </div>

                                    <div className="absolute right-6 top-6 z-10">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                            <Sparkles className="h-3 w-3" />
                                            {featured.isPinned ? "置顶" : "最新发布"}
                                        </span>
                                    </div>

                                    {featured.tags && featured.tags.length > 0 && (
                                        <div className="relative z-10 mb-4 flex flex-wrap gap-2 pr-24 sm:pr-28">
                                            {featured.tags.slice(0, 4).map((t: string) => (
                                                <span
                                                    key={t}
                                                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/78 ring-1 ring-white/10 backdrop-blur-sm"
                                                >
                                                    <Tag className="h-2.5 w-2.5" />
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <h2 className="relative z-10 mb-4 max-w-[760px] pr-24 text-2xl font-bold leading-tight text-white transition-colors group-hover:text-white sm:pr-28 md:text-3xl">
                                        {featured.title}
                                    </h2>

                                    <p className="relative z-10 mb-7 max-w-[760px] line-clamp-3 text-base leading-relaxed text-white/72">
                                        {stripHtml(featured.content).slice(0, 250)}
                                    </p>

                                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/62">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDate(featured.publishedAt || featured.updatedAt)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                {estimateReadTime(featured.content)} 分钟阅读
                                            </span>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-white transition-all group-hover:gap-2.5">
                                            阅读全文
                                            <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        )}

                        <ArticleList articles={restArticles} allTags={allTags} activeTag={tag} />
                    </div>

                    {/* 右侧统计/标签 */}
                    <aside className="w-full shrink-0 lg:w-[280px]">
                        <div className="space-y-8 lg:sticky lg:top-24">
                            <div className="rounded-[20px] border border-border bg-card p-6">
                                <h3 className="mb-4 text-sm font-semibold tracking-wide text-foreground">博客概览</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                                        <p className="text-2xl font-bold text-foreground">{articles.length}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">篇文章</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                                        <p className="text-2xl font-bold text-foreground">{allTags.length}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">个标签</p>
                                    </div>
                                </div>
                            </div>

                            {allTags.length > 0 && (
                                <div className="rounded-[20px] border border-border bg-card p-6">
                                    <h3 className="mb-4 text-sm font-semibold tracking-wide text-foreground">标签</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.slice(0, 15).map((t) => (
                                            <Link
                                                key={t.name}
                                                href={tag === t.name ? "/blog" : `/blog?tag=${t.name}`}
                                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                                    tag === t.name
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                                                }`}
                                            >
                                                {t.name}
                                                <span className={`text-[10px] ${tag === t.name ? "opacity-80" : "opacity-50"}`}>({t.count})</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="flex flex-col items-center py-24 text-center">
                    <div className="relative mb-7">
                        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] opacity-20 blur-2xl" />
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card shadow-sm">
                            <Sparkles className="h-9 w-9 text-primary" />
                        </div>
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-foreground">空白,正是开始的地方</h2>
                    <p className="mb-7 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        还没有发布任何文章。{user ? "现在就去写下第一篇灵感吧。" : "登录后即可撰写并发布你的第一篇作品。"}
                    </p>
                    <Link href={user ? "/articles" : "/sign-in"}>
                        <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:scale-[1.02] hover:brightness-110">
                            <Sparkles className="h-4 w-4" />
                            {user ? "开始写作" : "登录开始"}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </Link>
                </div>
            )}
        </>
    );
}
