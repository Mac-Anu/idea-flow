"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { Calendar, Tag, Clock, ChevronDown, X, ArrowRight } from "lucide-react";
import { stripHtml, formatDate, estimateReadTime } from "@/lib/article";
import { GradientCover } from "./GradientCover";
import type { Article } from "@/server/articles/type";

const ARTICLES_PER_PAGE = 6;

// 列表容器：子项依次错开入场
const listContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
};

// 单张卡片：自下方淡入
const cardItem: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface ArticleListProps {
    articles: Article[];
    allTags: { name: string; count: number }[];
    activeTag?: string | null;
    /** 标签筛选跳转的基础路径，默认 /blog */
    basePath?: string;
}

export function ArticleList({
    articles,
    allTags,
    activeTag = null,
    basePath = "/blog",
}: ArticleListProps) {
    const router = useRouter();
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);

    // 标签筛选
    const filteredArticles = activeTag
        ? articles.filter((a) => a.tags?.includes(activeTag))
        : articles;

    const displayedArticles = filteredArticles.slice(0, visibleCount);
    const hasMore = visibleCount < filteredArticles.length;

    const handleTagClick = (tagName: string | null) => {
        if (tagName === null || activeTag === tagName) {
            router.push(basePath, { scroll: false });
        } else {
            router.push(`${basePath}?tag=${tagName}`, { scroll: false });
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
                                onClick={() => handleTagClick(null)}
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
                        onClick={() => handleTagClick(null)}
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
                    <motion.div
                        key={activeTag ?? "all"}
                        variants={listContainer}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 gap-6 md:grid-cols-2"
                    >
                        {displayedArticles.map((article: Article) => {
                            const seed = article.slug || article.id || article.title;
                            return (
                                <motion.div key={article.id} variants={cardItem} layout>
                                    <Link
                                        href={`/blog/${article.slug || article.id}`}
                                        className="group block h-full"
                                    >
                                        <article className="relative flex min-h-[300px] flex-col overflow-hidden rounded-[20px] border border-border transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl sm:min-h-[280px] lg:min-h-[300px]">
                                            {/* 封面 */}
                                            <div className="absolute inset-0">
                                                {article.imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={article.imageUrl}
                                                        alt={article.title}
                                                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <GradientCover seed={seed} />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 transition-opacity duration-300" />
                                                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />
                                                <div className="absolute inset-0 bg-black/25 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100" />
                                            </div>

                                            {/* 顶部标签 */}
                                            <div className="relative z-10 p-5 pb-0">
                                                {article.tags && article.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {article.tags.slice(0, 3).map((tag: string) => (
                                                            <span
                                                                key={tag}
                                                                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/10 backdrop-blur-sm"
                                                            >
                                                                # {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 底部内容 */}
                                            <div className="relative z-10 mt-auto p-5 pt-16 text-white">
                                                <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-snug tracking-tight">
                                                    {article.title}
                                                </h3>
                                                <p className="mb-5 line-clamp-3 text-sm leading-6 text-white/75">
                                                    {stripHtml(article.content).slice(0, 130)}
                                                </p>
                                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-[11px] font-medium uppercase tracking-wide text-white/60">
                                                    <span className="flex min-w-0 items-center gap-1.5 normal-case tracking-normal">
                                                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                        {formatDate(article.publishedAt || article.updatedAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="flex items-center gap-1.5 group-hover:hidden">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {estimateReadTime(article.content)} 分钟
                                                        </span>
                                                        <span className="hidden items-center gap-1.5 text-white group-hover:flex">
                                                            Read More
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>

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
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center py-16"
                >
                    <div className="w-14 h-14 mb-5 rounded-2xl bg-muted border border-border flex items-center justify-center">
                        <Tag className="w-6 h-6 text-muted-foreground/70" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                        「{activeTag}」标签下还没有文章
                    </p>
                    <p className="text-xs text-muted-foreground mb-5">
                        换个标签，或回到全部文章看看
                    </p>
                    <button
                        onClick={() => handleTagClick(null)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        查看全部文章
                    </button>
                </motion.div>
            )}
        </div>
    );
}
