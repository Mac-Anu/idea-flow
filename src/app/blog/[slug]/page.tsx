import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BlogArticleContent } from "./BlogArticleContent";

async function getArticle(slug: string) {
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/articles/${slug}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const { article } = await res.json();
        if (!article?.publishedAt) return null;
        return article;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticle(slug);
    if (!article) return { title: "文章不存在 - IdeaFlow" };

    const plainText = article.content?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() || "";
    const description = plainText.slice(0, 160);

    return {
        title: `${article.title} - IdeaFlow`,
        description,
    };
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
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
                        <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-foreground">IdeaFlow</span>
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

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>发布于 {formatDate(article.publishedAt)}</span>
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />

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
                    <p className="mt-8 text-xs text-muted-foreground/50">© 2026 IdeaFlow.</p>
                </div>
            </footer>
        </div>
    );
}
