import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, Sparkles, Pencil, Clock } from "lucide-react";
import { estimateReadTime } from "@/lib/article";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BlogArticleContent } from "./BlogArticleContent";
import { AISummaryCard } from "@/components/article/AISummaryCard";

import { queryArticleItem } from "@/server/articles/service";

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

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src="/website-logo-flat.svg" alt="创想流 Logo" className="w-8 h-8 rounded-xl shadow-sm" />
                        <span className="text-lg font-semibold tracking-tight text-foreground">创想流</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            返回首页
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Article Content */}
            <main className="pt-28 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Meta */}
                    <div className="mb-8">
                        {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {article.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15] mb-5">
                            {article.title}
                        </h1>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>发布于 {formatDate(article.publishedAt)}</span>
                            </div>
                            {article.updatedAt && (
                                <div className="flex items-center gap-1.5">
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>编辑于 {formatDate(article.updatedAt)}</span>
                                </div>
                            )}
                            {article.content && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{estimateReadTime(article.content)} 分钟阅读</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />

                    <AISummaryCard summary={article.summary} />

                    {/* Rich text body + TOC (client component) */}
                    <BlogArticleContent content={article.content} />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-12 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-2xl border border-border hover:border-primary/30 hover:bg-accent transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回文章列表
                    </Link>
                    <p className="mt-8 text-xs text-muted-foreground/50">© 2026 创想流.</p>
                </div>
            </footer>
        </div>
    );
}
