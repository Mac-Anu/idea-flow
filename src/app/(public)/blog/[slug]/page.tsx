import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, Pencil, Clock } from "lucide-react";
import { estimateReadTime } from "@/lib/article";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BlogArticleContent } from "./BlogArticleContent";
import { AISummaryCard } from "@/components/article/AISummaryCard";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { RelatedArticles } from "@/components/article/RelatedArticles";

import { queryArticleItem, queryRelatedArticles } from "@/server/articles/service";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
    try {
        const article = await queryArticleItem(slug);
        if (!article?.publishedAt) return null;
        return article;
    } catch (e) {
        console.error("Failed to query article directly:", e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticle(slug);
    if (!article) return { title: "文章不存在 - 创想流" };

    const plainText = article.content?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() || "";
    const description = plainText.slice(0, 160);

    return {
        title: `${article.title} - 创想流`,
        description,
    };
}

function formatDate(dateInput: string | Date | null): string {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        notFound();
    }

    // 基于标签相似度查询相关推荐（服务端算好后传给展示组件）
    const relatedArticles = await queryRelatedArticles(slug, 3);

    return (
        <div className="text-foreground font-sans">
            {/* 阅读进度条 */}
            <ReadingProgress />

            {/* 顶部返回栏 */}
            <div className="mb-8 flex items-center justify-between">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回文章列表
                </Link>
                <ThemeToggle />
            </div>

            {/* Article Content */}
            <article className="mx-auto max-w-3xl pb-20">
                {/* Meta */}
                <div className="mb-8">
                    {article.tags && article.tags.length > 0 && (
                        <div className="mb-5 flex flex-wrap gap-2">
                            {article.tags.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                >
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1 className="mb-5 text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-4xl lg:text-5xl">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>发布于 {formatDate(article.publishedAt)}</span>
                        </div>
                        {article.updatedAt && (
                            <div className="flex items-center gap-1.5">
                                <Pencil className="h-3.5 w-3.5" />
                                <span>编辑于 {formatDate(article.updatedAt)}</span>
                            </div>
                        )}
                        {article.content && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{estimateReadTime(article.content)} 分钟阅读</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                <AISummaryCard summary={article.summary} />

                {/* Rich text body + TOC (client component) */}
                <BlogArticleContent content={article.content} />

                {/* 相关推荐（基于标签相似度） */}
                <RelatedArticles articles={relatedArticles} />

                {/* 底部返回 */}
                <div className="mt-12 border-t border-border pt-8 text-center">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 rounded-2xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-accent hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        返回文章列表
                    </Link>
                </div>
            </article>
        </div>
    );
}
