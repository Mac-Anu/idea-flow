"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, FileText, X } from "lucide-react";
import Link from "next/link";
import { Article } from "@/server/articles/type";
import { useDebouncedCallback } from "use-debounce";
import { client } from "@/lib/hono";

export const SearchModal = ({ onClose }: { onClose: () => void }) => {
    const [query, setQuery] = useState("");
    const [titleOnly, setTitleOnly] = useState(false);
    const [results, setResults] = useState<Article[]>([]);

    // ⌘K 和 Esc 快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);
    const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
        try {
            const res = await client.api.articles.search.$get({
                query: {
                    q: searchQuery,
                    titleOnly: String(titleOnly),
                },
            });
            if (res.ok) {
                const data = await res.json();
                setResults(data.articles);
            }
        } catch (error) {
            console.log("搜索失败", error);
        }
    }, 500);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]); // 清空输入就清空结果
            return;
        }
        debouncedSearch(query);
    }, [query, titleOnly]);

    const modalContent = (
        <>
            {/* 遮罩层 */}
            <div className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

            {/* 弹窗本体 */}
            <div
                className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[9999] 
                w-[90vw] max-w-[580px] bg-[rgba(255,251,245,0.95)] rounded-[24px] shadow-[0_30px_60px_rgba(33,24,14,0.08)] 
                border border-black/5 overflow-hidden backdrop-blur-xl"
            >
                {/* 搜索栏 */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-black/5 bg-white/40">
                    <Search size={18} className="text-[#a89d90] shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="想寻找刚才那一闪而过的灵感？"
                        autoFocus
                        className="flex-1 text-[15px] font-medium outline-none bg-transparent 
                            placeholder:text-[#a89d90] text-[#2d261f]"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="p-1.5 rounded-xl hover:bg-[#f3ead8] text-[#9b8f80] hover:text-[#8a6a2f] transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* 仅搜标题开关 */}
                <div className="px-6 py-2 border-b border-black/5 bg-white/40 flex items-center gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-medium text-[#9b8f80] cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={titleOnly}
                            onChange={() => setTitleOnly(!titleOnly)}
                            className="rounded border-[#a89d90] text-[#8a6a2f] focus:ring-[#8a6a2f]"
                        />
                        仅搜标题
                    </label>
                </div>

                {/* 搜索结果区域 */}
                <div className="max-h-[50vh] overflow-y-auto px-4 py-2">
                    {/* 没输入时的默认提示 */}
                    {!query.trim() && (
                        <div className="px-4 py-12 text-center text-sm font-medium text-[#9b8f80]">
                            你可以通过关键词、标签甚至是一整句话来唤醒沉睡的思维。
                        </div>
                    )}

                    {/* 有输入但没结果 */}
                    {query.trim() && results.length === 0 && (
                        <div className="px-4 py-12 text-center text-sm font-medium text-[#9b8f80]">
                            似乎这里什么也没有，去别处看看吧！
                        </div>
                    )}

                    {/* 搜索结果列表 */}
                    <div className="space-y-1">
                        {results.map((article) => {
                            // 从 content 里提取匹配片段
                            const plainText = article.content.replace(/<[^>]*>/g, ""); // 去掉 HTML 标签
                            const matchIndex = plainText.toLowerCase().indexOf(query.toLowerCase());
                            let snippet = "";
                            if (matchIndex >= 0) {
                                const start = Math.max(0, matchIndex - 20);
                                const end = Math.min(plainText.length, matchIndex + query.length + 40);
                                snippet = (start > 0 ? "..." : "") + plainText.slice(start, end) + (end < plainText.length ? "..." : "");
                            }

                            return (
                                <Link
                                    key={article.id}
                                    href={`/articles/${article.id}`}
                                    onClick={onClose}
                                    className="group flex items-start gap-4 px-4 py-4 
                                        rounded-2xl hover:bg-white/80 transition-all border border-transparent 
                                        hover:border-black/5 hover:shadow-sm"
                                >
                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white border border-black/5 group-hover:bg-[#f3ead8] group-hover:border-[#ead7b2] transition-colors">
                                        <FileText size={16} className="text-[#a89d90] group-hover:text-[#8a6a2f]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[15px] font-semibold text-[#2d261f] truncate group-hover:text-[#1f1d1a]">
                                            {article.title || "新页面"}
                                        </p>
                                        {snippet && (
                                            <p className="text-[13px] leading-relaxed text-[#6b6258] mt-1.5 line-clamp-2"
                                                dangerouslySetInnerHTML={{
                                                    __html: snippet.replace(
                                                        new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"),
                                                        '<mark class="bg-[#f3ead8] text-[#8a6a2f] px-1 py-0.5 rounded-md font-medium">$1</mark>'
                                                    ),
                                                }}
                                            />
                                        )}
                                        <p className="text-[11px] font-medium text-[#9b8f80] mt-2 flex items-center gap-2">
                                            {new Date(article.updatedAt).toLocaleDateString("zh-CN")}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* 底部快捷键提示 */}
                <div className="px-6 py-3 border-t border-black/5 bg-white/40 flex justify-end gap-3">
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
            </div>
        </>
    );

    // 等待客户端水合完成后再挂载到 body 上，防止服务端渲染(SSR)报错
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(modalContent, document.body);
};
