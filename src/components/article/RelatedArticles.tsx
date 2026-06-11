import Link from "next/link";
import { Sparkles, ArrowUpRight } from "lucide-react";

interface RelatedArticle {
    id: string;
    slug: string | null;
    title: string;
    summary: string | null;
    tags: string[] | null;
    publishedAt: string | Date | null;
}

/**
 * 文章底部的「相关推荐」区块。
 * 服务端组件，纯展示，推荐数据由页面通过 queryRelatedArticles 在服务端算好后传入。
 * 没有相关文章时整个区块不渲染（宁可不显示，也不凑无关内容）。
 */
export const RelatedArticles = ({ articles }: { articles: RelatedArticle[] }) => {
    if (!articles || articles.length === 0) return null;

    return (
        <section className="mt-16 pt-10 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground tracking-tight">相关推荐</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/blog/${article.slug || article.id}`}
                        className="group block h-full"
                    >
                        <article className="h-full p-5 rounded-[20px] border border-border bg-card hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                            {/* Tags */}
                            {article.tags && article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {article.tags.slice(0, 3).map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Title */}
                            <h3 className="text-base font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                {article.title}
                            </h3>

                            {/* Summary */}
                            {article.summary && (
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                                    {article.summary}
                                </p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-end pt-3 mt-auto">
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                            </div>
                        </article>
                    </Link>
                ))}
            </div>
        </section>
    );
};
