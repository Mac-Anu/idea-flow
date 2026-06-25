import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { queryPublishedArticles } from "@/server/articles/service";
import { stripHtml, formatDate, estimateReadTime } from "@/lib/article";
import type { Article } from "@/server/articles/type";
import type { ComponentType } from "react";

/**
 * 按标签过滤的已发布文章列表页。
 * Cheatsheet（tag=cheatsheet）和 Learn（tag=learn）共用此组件，只是传入的 tag/标题不同。
 *
 * @param tag - 过滤用的标签（小写英文，URL 友好）
 * @param title - 页面中文标题
 * @param description - 页面副标题描述
 * @param icon - 标题旁的图标组件
 * @param emptyHint - 无内容时的提示文案
 */
export async function TaggedArticleList({
    tag,
    title,
    description,
    icon: Icon,
    emptyHint,
}: {
    tag: string;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    emptyHint: string;
}) {
    let articles: Article[] = [];
    try {
        const all = (await queryPublishedArticles()) as Article[];
        const lower = tag.toLowerCase();
        articles = all.filter((a) => (a.tags ?? []).some((t) => t.toLowerCase() === lower));
    } catch (e) {
        console.warn("Failed to fetch articles during build/SSR.", e);
    }

    return (
        <div>
            <header className="mb-10">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
                        <Icon className="h-5 w-5" />
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
                </div>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
            </header>

            {articles.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {articles.map((article) => (
                        <Link key={article.id} href={`/blog/${article.slug || article.id}`} className="group block">
                            <article className="h-full rounded-[20px] border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
                                {article.tags && article.tags.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                        {article.tags.slice(0, 3).map((t) => (
                                            <span
                                                key={t}
                                                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <h2 className="text-lg font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary">
                                    {article.title}
                                </h2>
                                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                    {stripHtml(article.content).slice(0, 140)}
                                </p>
                                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDate(article.updatedAt)}
                                    </span>
                                    <span className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            {estimateReadTime(article.content)} 分钟
                                        </span>
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center py-24 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card shadow-sm">
                        <Icon className="h-9 w-9 text-primary" />
                    </div>
                    <h2 className="mt-6 text-xl font-semibold text-foreground">还没有内容</h2>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{emptyHint}</p>
                </div>
            )}
        </div>
    );
}
