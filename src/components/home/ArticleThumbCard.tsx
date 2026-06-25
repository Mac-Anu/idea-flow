"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { stripHtml, formatDate, estimateReadTime } from "@/lib/article";
import { GradientCover } from "./GradientCover";
import type { Article } from "@/server/articles/type";

export function ArticleThumbCard({ article, index = 0 }: { article: Article; index?: number }) {
    const seed = article.slug || article.id || article.title;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.4), ease: "easeOut" }}
        >
            <Link href={`/blog/${article.slug || article.id}`} className="group block h-full">
                <article className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[18px] border border-border transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
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
                        {/* 常态遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 transition-opacity duration-300" />
                        {/* hover 时模糊层 */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    {/* 顶部标签 */}
                    <div className="relative z-10 p-4">
                        {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {article.tags.slice(0, 3).map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                                    >
                                        # {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 底部内容 */}
                    <div className="relative z-10 p-5 text-white">
                        <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-snug">
                            {article.title}
                        </h3>

                        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-white/75">
                            {stripHtml(article.content).slice(0, 100)}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-white/60">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(article.publishedAt || article.updatedAt)}
                            </span>
                            {/* 默认显示阅读时间，hover 变成 Read More */}
                            <span className="flex items-center gap-1 transition-all duration-200">
                                <span className="flex items-center gap-1 group-hover:hidden">
                                    <Clock className="h-3 w-3" />
                                    {estimateReadTime(article.content)} 分钟阅读
                                </span>
                                <span className="hidden items-center gap-1 font-medium text-white group-hover:flex">
                                    Read More
                                    <ArrowRight className="h-3 w-3" />
                                </span>
                            </span>
                        </div>
                    </div>
                </article>
            </Link>
        </motion.div>
    );
}
