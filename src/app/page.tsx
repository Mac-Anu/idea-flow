import { Sparkles, ArrowRight, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getPublishedArticles() {
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/articles/public`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return [];
        const { data } = await res.json();
        return data || [];
    } catch {
        return [];
    }
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export default async function Home() {
    const articles = await getPublishedArticles();
    
    // 获取用户会话状态
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const user = session?.user;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-foreground">IdeaFlow</span>
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

            {/* Hero Section */}
            <main className="pt-32 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-semibold mb-8">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="tracking-wide">个人技术博客</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-[1.1]">
                            思考、记录、<span className="text-primary">分享</span>
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            这里记录了我的技术探索、项目复盘与成长思考。每一篇文章都是经过深度打磨的知识沉淀。
                        </p>
                    </div>

                    {/* Article List */}
                    {articles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article: any) => (
                                <Link
                                    key={article.id}
                                    href={`/blog/${article.slug || article.id}`}
                                    className="group"
                                >
                                    <article className="h-full p-6 rounded-[24px] border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col">
                                        {/* Tags */}
                                        {article.tags && article.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {article.tags.slice(0, 3).map((tag: string) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
                                                    >
                                                        <Tag className="w-2.5 h-2.5" />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Title */}
                                        <h2 className="text-lg font-semibold text-card-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                            {article.title}
                                        </h2>

                                        {/* Excerpt */}
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
                                            {stripHtml(article.content).slice(0, 150)}...
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(article.publishedAt)}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-primary/70 group-hover:text-primary transition-colors">
                                                阅读全文
                                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted border border-border flex items-center justify-center">
                                <Sparkles className="w-7 h-7 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-lg">还没有发布任何文章</p>
                            <p className="text-muted-foreground/60 text-sm mt-2">登录后撰写并发布你的第一篇作品吧</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-border py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm font-medium text-muted-foreground">
                        © 2026 IdeaFlow. 探索、思考与沉淀
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="/articles" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">工作台</Link>
                        <a href="mailto:hello@example.com" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">联系作者</a>
                        <a href="https://github.com/Bruce-L-J" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
