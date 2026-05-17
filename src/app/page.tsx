import { Sparkles, ArrowRight, Calendar, Tag, Clock } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { articlesApi } from "@/api/articles";
import { stripHtml, formatDate, estimateReadTime, collectTags } from "@/lib/article";
import { ArticleList } from "@/components/home/ArticleList";

export default async function Home() {
    // ========== 数据层 ==========
    const articles = await articlesApi.published();

    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const user = session?.user;

    const allTags = collectTags(articles);
    const featured = articles.length > 0 ? articles[0] : null;
    const restArticles = articles.slice(1);

    // ========== 视图层 ==========
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

            <main className="pt-28 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Hero */}
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-semibold mb-5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="tracking-wide">个人技术博客</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-4 leading-[1.1]">
                            思考、记录、<span className="text-primary">分享</span>
                        </h1>

                        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                            这里记录了我的技术探索、项目复盘与成长思考。每一篇文章都是经过深度打磨的知识沉淀。
                        </p>
                    </div>

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
                                                    最新发布
                                                </span>
                                            </div>

                                            {featured.tags && featured.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
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

                                            <h2 className="text-2xl md:text-3xl font-bold text-card-foreground mb-4 group-hover:text-primary transition-colors leading-tight">
                                                {featured.title}
                                            </h2>

                                            <p className="text-base text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                                                {stripHtml(featured.content).slice(0, 250)}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(featured.publishedAt)}
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
                                                {allTags.slice(0, 15).map((tag) => (
                                                    <span
                                                        key={tag.name}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border bg-muted/30 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors cursor-default"
                                                    >
                                                        {tag.name}
                                                        <span className="text-[10px] opacity-50">({tag.count})</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </aside>
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
