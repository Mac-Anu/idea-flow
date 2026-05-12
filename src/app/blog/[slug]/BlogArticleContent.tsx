"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "@/components/article/editor/TiptapEditor.css";

interface Heading {
    level: number;
    text: string;
    index: number;
}

/**
 * 博客文章正文 + 右侧目录导航（一比一复刻编辑器的 TableOfContents）
 * 动态查询 DOM 以防止 React 渲染导致的元素脱离问题
 */
export function BlogArticleContent({ content }: { content: string }) {
    const contentRef = useRef<HTMLDivElement>(null);
    const dashesContainerRef = useRef<HTMLDivElement>(null);
    const tocContainerRef = useRef<HTMLDivElement>(null);
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // 渲染后，从 DOM 中提取所有标题结构
    useEffect(() => {
        if (!contentRef.current) return;

        const els = Array.from(contentRef.current.querySelectorAll("h1, h2, h3"));
        
        const extracted: Heading[] = els.map((el, i) => {
            return {
                level: parseInt(el.tagName[1]),
                text: el.textContent || "",
                index: i,
            };
        });

        setHeadings(extracted);
    }, [content]);

    // 使用高频、可靠的 scroll 事件进行动态检测
    useEffect(() => {
        if (headings.length === 0) return;

        const handleScroll = () => {
            if (!contentRef.current) return;
            
            // 每次滚动都重新获取 DOM，防止因为 hydration 导致之前的节点引用失效
            const els = Array.from(contentRef.current.querySelectorAll("h1, h2, h3"));
            if (els.length === 0) return;

            const scrollY = window.scrollY;
            // 固定导航栏高度 64px + 预留间距
            const offset = 100; 
            
            let current = 0;

            for (let i = 0; i < els.length; i++) {
                const el = els[i] as HTMLElement;
                // 计算该标题距离页面顶部的绝对位置
                const top = el.getBoundingClientRect().top + scrollY - offset;
                if (scrollY >= top - 50) { // 增加一点提前高亮的宽容度
                    current = i;
                }
            }

            setActiveIndex(current);
        };

        // 初始执行一次
        handleScroll();

        // 监听 window 的滚动
        window.addEventListener("scroll", handleScroll, { passive: true });
        
        // 有些时候滚动可能发生在外层某个特定的 DOM 上，我们也加上对 body 和 documentElement 的监听，双重保险
        document.body.addEventListener("scroll", handleScroll, { passive: true });
        document.documentElement.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.body.removeEventListener("scroll", handleScroll);
            document.documentElement.removeEventListener("scroll", handleScroll);
        };
    }, [headings]);

    // 监听 activeIndex 变化，自动滚动目录容器以保证当前高亮项始终在视口内
    useEffect(() => {
        if (headings.length === 0) return;

        // 1. 同步滚动左侧的横线容器 (隐藏滚动条的容器)
        if (dashesContainerRef.current) {
            const activeDash = dashesContainerRef.current.children[activeIndex] as HTMLElement;
            if (activeDash) {
                dashesContainerRef.current.scrollTo({
                    top: activeDash.offsetTop - dashesContainerRef.current.offsetHeight / 2,
                    behavior: "smooth"
                });
            }
        }

        // 2. 同步滚动右侧展开的面板 (带滚动条的容器)
        if (tocContainerRef.current) {
            const listContainer = tocContainerRef.current.querySelector('.toc-list') as HTMLElement;
            if (listContainer) {
                const activeToc = listContainer.children[activeIndex] as HTMLElement;
                if (activeToc) {
                    const topPos = activeToc.offsetTop;
                    // 当元素快要超出视口时，将面板中心对齐该元素
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
        if (!contentRef.current) return;
        
        // 动态获取节点
        const els = Array.from(contentRef.current.querySelectorAll("h1, h2, h3"));
        const el = els[index] as HTMLElement;
        
        if (el) {
            // 手动计算滚动位置，避开 fixed 导航栏 (导航栏约 64px 高度)
            const targetPosition = el.getBoundingClientRect().top + window.scrollY - 80;
            
            // 立即高亮
            setActiveIndex(index);
            
            window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
            });
        }
    }, []);

    const filtered = headings.filter((h) => h.level <= 3);

    return (
        <>
            {/* 富文本正文 —— 复用编辑器的 .tiptap 样式 */}
            <div
                ref={contentRef}
                className="tiptap"
                dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* 右侧目录导航（一比一复刻编辑器的 TableOfContents） */}
            {filtered.length > 0 && (
                <div className="group fixed right-6 xl:right-10 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
                    
                    {/* 竖线指示器（默认显示，hover 时隐藏） */}
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

                    {/* TOC 面板（默认隐藏，hover 时滑入） */}
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
                        {/* 固定在顶部的标题 */}
                        <div className="sticky top-0 bg-popover/95 backdrop-blur-sm z-10 px-5 pt-5 pb-2">
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground/70 select-none">
                                Contents
                            </p>
                        </div>
                        
                        {/* 滚动的目录列表 */}
                        <div className="space-y-1.5 toc-list px-5 pb-5">
                            {filtered.map((h) => (
                                <div
                                    key={h.index}
                                    onClick={() => handleClick(h.index)}
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
