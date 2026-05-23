"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, Trash2, RotateCcw, FileText, X, AlertCircle } from "lucide-react";
import { Article } from "@/server/articles/type";
import { articlesApi } from "@/api/articles";
import { useRouter } from "next/navigation";

interface TrashModalProps {
    onClose: () => void;
    /** 侧边栏的 DOM 引用，用来定位面板 */
    sidebarRef?: React.RefObject<HTMLElement | null>;
}

export const TrashModal = ({ onClose, sidebarRef }: TrashModalProps) => {
    const [query, setQuery] = useState("");
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
    const router = useRouter();

    // 计算面板定位（紧贴侧边栏右侧）
    useEffect(() => {
        const computePos = () => {
            if (sidebarRef?.current) {
                const rect = sidebarRef.current.getBoundingClientRect();
                setPanelStyle({
                    left: rect.right + 8,
                    top: rect.top,
                    height: rect.height,
                });
            } else {
                // 降级：左侧固定
                setPanelStyle({ left: 316, top: 16, bottom: 16 });
            }
        };
        computePos();
        window.addEventListener("resize", computePos);
        return () => window.removeEventListener("resize", computePos);
    }, [sidebarRef]);

    // Esc 关闭
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // 拉取回收站列表
    useEffect(() => {
        setLoading(true);
        articlesApi.trash().then(async (res) => {
            if (res.ok) {
                const json = await res.json();
                setArticles((json as { data: Article[] }).data ?? []);
            }
            setLoading(false);
        });
    }, []);

    const handleRestore = async (id: string) => {
        setRestoringId(id);
        await articlesApi.restore(id);
        setArticles((prev) => prev.filter((a) => a.id !== id));
        setRestoringId(null);
        router.refresh();
    };

    const filtered = articles.filter((a) =>
        (a.title || "新页面").toLowerCase().includes(query.toLowerCase())
    );

    const daysLeft = (deleteAt: string | null) => {
        if (!deleteAt) return 30;
        const deleted = new Date(deleteAt).getTime();
        const expiry = deleted + 30 * 24 * 60 * 60 * 1000;
        return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)));
    };

    const panel = (
        <>
            {/* 透明遮罩（点击关闭，不遮挡视觉） */}
            <div
                className="fixed inset-0 z-[9998]"
                onClick={onClose}
            />

            {/* 侧边面板 */}
            <div
                className="fixed z-[9999] w-[280px] flex flex-col rounded-[18px] border border-border bg-popover text-popover-foreground shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden backdrop-blur-xl animate-in slide-in-from-left-2 duration-200"
                style={panelStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 搜索栏 */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                    <Search size={14} className="text-muted-foreground shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="搜索被移入垃圾箱的页面"
                        autoFocus
                        className="flex-1 text-[13px] outline-none bg-transparent text-foreground placeholder:text-muted-foreground/50"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* 列表区域 */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2.5 text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                            <span className="text-xs">加载中...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
                            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                                <Trash2 size={20} className="opacity-40" />
                            </div>
                            <div className="text-center">
                                <p className="text-[13px] font-medium text-foreground">无结果</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {query ? "没有匹配的已删除页面" : "垃圾箱是空的"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-1.5 space-y-0.5">
                            {filtered.map((article) => {
                                const days = daysLeft(article.deleteAt);
                                const isExpiringSoon = days <= 7;
                                return (
                                    <div
                                        key={article.id}
                                        className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-accent/60 transition-all"
                                    >
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
                                            <FileText size={12} className="text-muted-foreground" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12px] font-medium text-foreground truncate">
                                                {article.title || "新页面"}
                                            </p>
                                            <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isExpiringSoon ? "text-destructive" : "text-muted-foreground/60"}`}>
                                                {isExpiringSoon && <AlertCircle size={9} />}
                                                {days > 0 ? `${days} 天后删除` : "即将删除"}
                                            </p>
                                        </div>

                                        {/* 恢复按钮 */}
                                        <button
                                            onClick={() => handleRestore(article.id)}
                                            disabled={restoringId === article.id}
                                            title="恢复"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-lg hover:bg-card border border-transparent hover:border-border text-muted-foreground hover:text-primary disabled:opacity-50 shrink-0"
                                        >
                                            {restoringId === article.id ? (
                                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <RotateCcw size={11} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 底部提示 */}
                <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                        <Trash2 size={9} />
                        30 天后自动删除
                    </p>
                    <button
                        onClick={onClose}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-[9px] font-bold border border-border">ESC</kbd>
                        关闭
                    </button>
                </div>
            </div>
        </>
    );

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(panel, document.body);
};
