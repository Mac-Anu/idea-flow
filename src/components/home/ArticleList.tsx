"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Tag, Clock, ArrowRight, ChevronDown, X } from "lucide-react";
import { stripHtml, formatDate, estimateReadTime } from "@/lib/article";

const ARTICLES_PER_PAGE = 6;

interface ArticleListProps {
    articles: any[];
    allTags: { name: string; count: number }[];
}

export function ArticleList({
    articles,
    allTags,
}: ArticleListProps) {
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);

    // 标签筛选
    const filteredArticles = activeTag
        ? articles.filter((a) => a.tags?.includes(activeTag))
        : articles;

    const displayedArticles = filteredArticles.slice(0, visibleCount);
    const hasMore = visibleCount < filteredArticles.length;

    const handleTagClick = (tagName: string) => {
        if (activeTag === tagName) {
            setActiveTag(null);
        } else {
            setActiveTag(tagName);
        }
        setVisibleCount(ARTICLES_PER_PAGE); // 切换标签时重置分页
    };

    return (
        <div>
            {/* 分区标题 + 标签筛选 */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                    {activeTag ? (
                        <span className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-primary" />
                            {activeTag}
                            <button
                                onClick={() => setActiveTag(null)}
                                className="ml-1 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                                ({filteredArticles.length} 篇)
                            </span>
                        </span>
                    ) : (
                        `全部文章`
                    )}
                </h2>
            </div>

            {/* 标签快捷筛选栏 */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => { setActiveTag(null); setVisibleCount(ARTICLES_PER_PAGE); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                            activeTag === null
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        全部
                    </button>
                    {allTags.slice(0, 8).map((tag) => (
                        <button
                            key={tag.name}
                            onClick={() => handleTagClick(tag.name)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                                activeTag === tag.name
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            )}

            {/* 文章列表 - 紧凑的双列布局 */}
            {filteredArticles.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {displayedArticles.map((article: any) => (
                            <Link
                                key={article.id}
                                href={`/blog/${article.slug || article.id}`}
                                className="group"
                            >
                                <article className="h-full p-5 rounded-[20px] border border-border bg-card hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                                    {/* Tags */}
                                    {article.tags && article.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {article.tags.slice(0, 3).map((tag: string) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium"
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

                                    {/* Excerpt */}
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4 flex-1">
                                        {stripHtml(article.content).slice(0, 120)}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(article.publishedAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {estimateReadTime(article.content)}min
                                            </span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>

                    {/* 加载更多 */}
                    {hasMore && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setVisibleCount((c) => c + ARTICLES_PER_PAGE)}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                            >
                                <ChevronDown className="w-4 h-4" />
                                加载更多 ({filteredArticles.length - visibleCount} 篇)
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">该标签下暂无文章</p>
                </div>
            )}
        </div>
    );
}
