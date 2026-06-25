"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TiptapEditor } from "@/components/article/editor/TiptapEditor";
import { TextSelectionExplainer } from "@/components/article/TextSelectionExplainer";

interface Heading {
    level: number;
    text: string;
    index?: number;
    pos?: number;
}

/**
 * 博客文章正文 + 右侧目录导航（一比一复刻编辑器的 TableOfContents）
 */
export function BlogArticleContent({ content }: { content: string }) {
    const dashesContainerRef = useRef<HTMLDivElement>(null);
    const tocContainerRef = useRef<HTMLDivElement>(null);
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [editorInstance, setEditorInstance] = useState<import("@tiptap/react").Editor | null>(null);

    // 当大纲变更时更新状态（由 TiptapEditor 的 onHeadingsChange 触发）
    const handleHeadingsChange = useCallback((newHeadings: Heading[]) => {
        setHeadings(newHeadings.map((h, i) => ({ ...h, index: i })));
    }, []);

    // 获取到编辑器实例
    const handleEditorReady = useCallback((editor: import("@tiptap/react").Editor) => {
        setEditorInstance(editor);
    }, []);

    // 目录跟随滚动逻辑（基于 pos 或者简单的 DOM 查询）
    useEffect(() => {
        if (headings.length === 0 || !editorInstance) return;

        const handleScroll = () => {
            // Tiptap 的根 DOM 元素
            const container = editorInstance.view.dom;
            if (!container) return;
            
            const els = Array.from(container.querySelectorAll("h1, h2, h3"));
            if (els.length === 0) return;

            const scrollY = window.scrollY;
            const offset = 100; 
            
            let current = 0;
            for (let i = 0; i < els.length; i++) {
                const el = els[i] as HTMLElement;
                const top = el.getBoundingClientRect().top + scrollY - offset;
                if (scrollY >= top - 50) {
                    current = i;
                }
            }

            setActiveIndex(current);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [headings, editorInstance]);

    // 目录面板自动滚动
    useEffect(() => {
        if (headings.length === 0) return;

        if (dashesContainerRef.current) {
            const activeDash = dashesContainerRef.current.children[activeIndex] as HTMLElement;
            if (activeDash) {
                dashesContainerRef.current.scrollTo({
                    top: activeDash.offsetTop - dashesContainerRef.current.offsetHeight / 2,
                    behavior: "smooth"
                });
            }
        }

        if (tocContainerRef.current) {
            const listContainer = tocContainerRef.current.querySelector('.toc-list') as HTMLElement;
            if (listContainer) {
                const activeToc = listContainer.children[activeIndex] as HTMLElement;
                if (activeToc) {
                    const topPos = activeToc.offsetTop;
                    if (
                        topPos < tocContainerRef.current.scrollTop + 40 || 
                        topPos > tocContainerRef.current.scrollTop + tocContainerRef.current.offsetHeight - 40
                    ) {
                        tocContainerRef.current.scrollTo({
                            top: topPos - tocContainerRef.current.offsetHeight / 2,
                            behavior: "smooth"
                        });
                    }
                }
            }
        }
    }, [activeIndex, headings.length]);

    // 点击标题跳转
    const handleClick = useCallback((index: number) => {
        if (!editorInstance) return;
        const container = editorInstance.view.dom;
        if (!container) return;
        
        const els = Array.from(container.querySelectorAll("h1, h2, h3"));
        const el = els[index] as HTMLElement;
        
        if (el) {
            const targetPosition = el.getBoundingClientRect().top + window.scrollY - 80;
            setActiveIndex(index);
            window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
            });
        }
    }, [editorInstance]);

    const filtered = headings.filter((h) => h.level <= 3);

    return (
        <>
            {/* 使用只读模式的 TiptapEditor，保证渲染和编辑器 100% 一致！ */}
            <div className="tiptap-readonly-wrapper tiptap relative">
                <TextSelectionExplainer />
                <TiptapEditor 
                    content={content} 
                    readOnly={true} 
                    onHeadingsChange={handleHeadingsChange}
                    onEditorReady={handleEditorReady}
                />
            </div>

            {/* 右侧目录导航 */}
            {filtered.length > 0 && (
                <div className="group fixed right-6 xl:right-10 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
                    <div 
                        ref={dashesContainerRef}
                        className="flex flex-col gap-3.5 items-end transition-opacity duration-300 group-hover:opacity-0 cursor-pointer max-h-[60vh] overflow-hidden py-[10vh]"
                        style={{ 
                            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
                            maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)"
                        }}
                    >
                        {filtered.map((h) => (
                            <div
                                key={h.index}
                                className="h-[2px] rounded-full transition-all duration-300 shrink-0"
                                style={{
                                    width: activeIndex === h.index ? "20px" : `${20 - (h.level - 1) * 6}px`,
                                    background: activeIndex === h.index ? "var(--primary)" : "var(--border)",
                                    opacity: activeIndex === h.index ? 1 : 0.5,
                                }}
                            />
                        ))}
                    </div>

                    <div
                        ref={tocContainerRef}
                        className="absolute right-0 top-1/2 -translate-y-1/2
                        opacity-0 pointer-events-none translate-x-4
                        group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0
                        transition-all duration-300 ease-out
                        bg-popover backdrop-blur-md border border-border rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] 
                        min-w-[180px] max-w-[260px]
                        text-[13px] text-muted-foreground leading-relaxed max-h-[70vh] overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-popover/95 backdrop-blur-sm z-10 px-5 pt-5 pb-2">
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground/70 select-none">
                                Contents
                            </p>
                        </div>
                        
                        <div className="space-y-1.5 toc-list px-5 pb-5">
                            {filtered.map((h) => (
                                <div
                                    key={h.index}
                                    onClick={() => handleClick(h.index as number)}
                                    className={`py-1 cursor-pointer transition-all duration-200 truncate rounded-lg
                                        ${
                                            activeIndex === h.index
                                                ? "text-primary font-semibold bg-accent px-2 -ml-2"
                                                : "hover:text-foreground"
                                        }`}
                                    style={{
                                        paddingLeft:
                                            activeIndex === h.index
                                                ? `${(h.level - 1) * 12 + 8}px`
                                                : `${(h.level - 1) * 12}px`,
                                    }}
                                >
                                    {h.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
