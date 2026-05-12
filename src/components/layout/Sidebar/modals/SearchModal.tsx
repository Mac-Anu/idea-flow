"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, FileText, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { client } from "@/lib/hono";
import { InferResponseType } from "hono/client";
import { useDebouncedCallback } from "use-debounce";

type SearchResponse = InferResponseType<typeof client.api.articles.search.$get, 200>;
type SearchResultArticle = SearchResponse["articles"][0];

export const SearchModal = ({ onClose }: { onClose: () => void }) => {
    const [query, setQuery] = useState("");
    const [titleOnly, setTitleOnly] = useState(false);
    const [results, setResults] = useState<SearchResultArticle[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();

    // ⌘K 和 Esc 快捷键以及上下键选择
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(prev + 1, results.length > 0 ? results.length - 1 : 0));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && results[activeIndex]) {
                e.preventDefault();
                router.push(`/articles/${results[activeIndex].id}?highlight=${encodeURIComponent(query)}`);
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, results, activeIndex, query, router]);
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
                setActiveIndex(0);
            } else {
                console.error("搜索 API 返回错误:", res.status, await res.text().catch(() => ""));
            }
        } catch (error) {
            console.error("搜索请求异常:", error);
        }
    }, 300);

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
                className={`fixed top-[12%] left-1/2 -translate-x-1/2 z-[9999] 
                ${results.length > 0 ? "w-[95vw] max-w-[850px]" : "w-[90vw] max-w-[580px]"}
                bg-popover rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.08)] 
                border border-border overflow-hidden backdrop-blur-xl text-popover-foreground transition-all duration-300`}
            >
                {/* 搜索栏 */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-transparent">
                    <Search size={18} className="text-muted-foreground shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="想寻找刚才那一闪而过的灵感？"
                        autoFocus
                        className="flex-1 text-[15px] font-medium outline-none bg-transparent 
                            placeholder:text-muted-foreground/50 text-foreground"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* 仅搜标题开关 */}
                <div className="px-6 py-2 border-b border-border bg-transparent flex items-center gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={titleOnly}
                            onChange={() => setTitleOnly(!titleOnly)}
                            className="rounded border-input text-primary focus:ring-primary"
                        />
                        仅搜标题
                    </label>
                </div>

                {/* 搜索结果区域 */}
                {(!query.trim() || results.length === 0) ? (
                    <div className="max-h-[50vh] overflow-y-auto px-4 py-2">
                        {!query.trim() && (
                            <div className="px-4 py-12 text-center text-sm font-medium text-muted-foreground">
                                你可以通过关键词、标签甚至是一整句话来唤醒沉睡的思维。
                            </div>
                        )}
                        {query.trim() && results.length === 0 && (
                            <div className="px-4 py-12 text-center text-sm font-medium text-muted-foreground">
                                似乎这里什么也没有，去别处看看吧！
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex h-[55vh] min-h-[400px]">
                        {/* 左侧列表 */}
                        <div className="w-[320px] lg:w-[380px] border-r border-border overflow-y-auto p-2 space-y-1">
                            {results.map((article: any, index: number) => {
                                const isActive = index === activeIndex;
                                const snippets: string[] = article.snippets || [];
                                const queryTokens = query.toLowerCase().split(/[\s\p{P}\p{S}]+/u).filter(Boolean);
                                const highlightText = (text: string) => {
                                    let html = text;
                                    queryTokens.forEach(token => {
                                        if (token.length > 0) {
                                            html = html.replace(
                                                new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"),
                                                '<mark class="bg-primary/20 text-primary px-1 rounded-sm font-semibold">$1</mark>'
                                            );
                                        }
                                    });
                                    return html;
                                };

                                return (
                                    <div
                                        key={article.id}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => {
                                            router.push(`/articles/${article.id}?highlight=${encodeURIComponent(query)}`);
                                            onClose();
                                        }}
                                        className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer border border-transparent select-none
                                            ${isActive ? "bg-accent/80 border-border shadow-sm" : "hover:bg-accent/40"}`}
                                    >
                                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors
                                            ${isActive ? "bg-background border border-border shadow-sm text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                                            <FileText size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[14px] font-semibold truncate ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                                {article.title || "新页面"}
                                            </p>
                                            {snippets.length > 0 ? (
                                                <p 
                                                    className="text-[12px] text-muted-foreground mt-1 line-clamp-1 truncate"
                                                    dangerouslySetInnerHTML={{ __html: highlightText(snippets[0]) }}
                                                />
                                            ) : (
                                                <p className="text-[11px] font-medium text-muted-foreground/60 mt-1">
                                                    {new Date(article.updatedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* 右侧预览 */}
                        <div className="flex-1 overflow-y-auto bg-card/10 p-6 lg:p-8">
                            {results[activeIndex] && (() => {
                                const activeArticle = results[activeIndex] as any;
                                const snippets: string[] = activeArticle.snippets || [];
                                const queryTokens = query.toLowerCase().split(/[\s\p{P}\p{S}]+/u).filter(Boolean);
                                
                                const highlightText = (text: string) => {
                                    let html = text;
                                    queryTokens.forEach(token => {
                                        if (token.length > 0) {
                                            html = html.replace(
                                                new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"),
                                                '<mark class="bg-primary/20 text-primary px-1 rounded-sm font-semibold">$1</mark>'
                                            );
                                        }
                                    });
                                    return html;
                                };

                                return (
                                    <div className="animate-in fade-in zoom-in-95 duration-200">
                                        <h3 className="text-[20px] font-bold text-foreground mb-6">
                                            {activeArticle.title || "新页面"}
                                        </h3>
                                        <div className="space-y-4">
                                            {snippets.length > 0 ? snippets.map((snippet, idx) => (
                                                <p 
                                                    key={idx}
                                                    className="text-[14px] leading-[1.8] text-muted-foreground break-words"
                                                    dangerouslySetInnerHTML={{ __html: highlightText(snippet) }}
                                                />
                                            )) : (
                                                <p className="text-[14px] leading-[1.8] text-muted-foreground">
                                                    {activeArticle.content.replace(/<[^>]*>/g, "").slice(0, 200)}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* 底部快捷键提示 */}
                <div className="px-6 py-3 border-t border-border bg-transparent flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-[10px] uppercase font-bold shadow-sm border border-border">
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
