"use client";

import { X, Search, FileText, Calendar } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Article } from "@/server/articles/type";

interface AllArticlesModalProps {
    articles: Article[];
    onClose: () => void;
}

export const AllArticlesModal = ({ articles, onClose }: AllArticlesModalProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    // 简单的本地搜索
    const filteredArticles = articles.filter((article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <>
            {/* 全屏隐形遮罩 */}
            <div
                className="fixed inset-0 z-[55] bg-black/10 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* 抽屉本体，依靠在 relative 的 sidebar 右侧 */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-0 left-full ml-4 z-[60] h-full w-[320px] rounded-[28px] bg-[rgba(255,251,245,0.95)] border border-black/5 shadow-[0_20px_50px_rgba(33,24,14,0.06)] backdrop-blur-md flex flex-col overflow-hidden"
            >
                {/* 头部：搜索框 */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-black/5">
                    <Search size={16} className="text-[#a89d90]" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="在库中搜索页面..."
                        className="flex-1 bg-transparent border-none outline-none text-[#3a342e] placeholder:text-[#a89d90] text-sm h-8"
                        autoFocus
                    />
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-[#f3ead8] text-[#9b8f80] hover:text-[#8a6a2f] transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* 列表区域 */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {filteredArticles.length === 0 ? (
                        <div className="py-12 text-center text-[#9b8f80] text-sm">
                            没有找到相关页面
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredArticles.map((article) => (
                                <Link
                                    key={article.id}
                                    href={`/articles/${article.id}`}
                                    onClick={onClose}
                                >
                                    <div className="group flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-white/80 transition-colors cursor-pointer border border-transparent hover:border-black/5">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white border border-black/5 group-hover:bg-[#f3ead8] group-hover:border-[#ead7b2] transition-colors">
                                                <FileText
                                                    size={14}
                                                    className="text-[#9b8f80] group-hover:text-[#8a6a2f]"
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-[#5c544c] truncate group-hover:text-[#2d261f]">
                                                {article.title || "无标题文章"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#a89d90] whitespace-nowrap ml-3">
                                            <Calendar size={12} />
                                            <span>
                                                {new Date(article.createdAt).toLocaleDateString(
                                                    "zh-CN",
                                                    {
                                                        month: "short",
                                                        day: "numeric",
                                                    },
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* 底部信息 */}
                <div className="px-5 py-3 border-t border-black/5 bg-white/40 flex justify-between items-center">
                    <span className="text-[11px] font-medium tracking-wide text-[#9b8f80]">
                        共 {filteredArticles.length} 个页面
                    </span>
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-[#9b8f80] hover:text-[#8a6a2f] transition-colors cursor-pointer"
                    >
                        <kbd className="px-2 py-1 bg-[#f3ead8] text-[#8a6a2f] rounded-md text-[10px] uppercase font-bold shadow-sm">
                            ESC
                        </kbd>
                        <span>关闭</span>
                    </button>
                </div>
            </motion.div>
        </>
    );
};
