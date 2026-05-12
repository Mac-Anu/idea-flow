"use client";
import { Editor } from "@tiptap/react";
import { useState, useEffect, useCallback, useRef } from "react";

interface Heading {
    level: number;
    text: string;
    pos: number;
}

export const TableOfContents = ({
    headings,
    editor,
}: {
    headings: Heading[];
    editor: Editor | null;
}) => {
    const dashesContainerRef = useRef<HTMLDivElement>(null);
    const tocContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const filtered = headings.filter((h) => h.level <= 3);

    // 用 IntersectionObserver 监听哪个标题滚动进入视口
    useEffect(() => {
        if (!editor || filtered.length === 0) return;

        // 收集所有标题的 DOM 节点
        const headingEls: HTMLElement[] = [];
        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === "heading" && node.attrs.level <= 3) {
                try {
                    const { node: domNode } = editor.view.domAtPos(pos + 1);
                    const el = domNode instanceof HTMLElement ? domNode : domNode.parentElement;
                    if (el) headingEls.push(el);
                } catch {
                    // 忽略不存在的 dom 位置
                }
            }
        });

        if (headingEls.length === 0) return;

        // rootMargin: 顶部 -10% 到底部 -60%，确保进入"上方视口区域"时才算激活
        const observer = new IntersectionObserver(
            (entries) => {
                // 找到所有正在相交的标题，取最上面那个
                const intersecting = entries
                    .filter((e) => e.isIntersecting)
                    .map((e) => headingEls.indexOf(e.target as HTMLElement))
                    .filter((i) => i !== -1);

                if (intersecting.length > 0) {
                    setActiveIndex(Math.min(...intersecting));
                }
            },
            { rootMargin: "-10% 0px -60% 0px", threshold: 0 }
        );

        headingEls.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [editor, filtered.length]);

    // 监听 activeIndex 变化，自动滚动目录容器以保证当前高亮项始终在视口内
    useEffect(() => {
        if (filtered.length === 0 || activeIndex === null) return;

        // 1. 同步滚动左侧的横线容器
        if (dashesContainerRef.current) {
            const activeDash = dashesContainerRef.current.children[activeIndex] as HTMLElement;
            if (activeDash) {
                dashesContainerRef.current.scrollTo({
                    top: activeDash.offsetTop - dashesContainerRef.current.offsetHeight / 2,
                    behavior: "smooth"
                });
            }
        }

        // 2. 同步滚动右侧展开的面板
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
    }, [activeIndex, filtered.length]);

    const handleClick = (pos: number, index: number) => {
        if (!editor) return;
        setActiveIndex(index);
        try {
            const { node } = editor.view.domAtPos(pos + 1);
            const el = node instanceof HTMLElement ? node : node.parentElement;
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
            // 忽略
        }
    };

    if (filtered.length === 0) return null;

    return (
        <div className="group fixed right-6 xl:right-10 top-1/2 -translate-y-1/2 z-50">
            {/* 竖线指示器（默认显示，hover 时隐藏） */}
            <div 
                ref={dashesContainerRef}
                className="flex flex-col gap-3.5 items-end transition-opacity duration-300 group-hover:opacity-0 cursor-pointer max-h-[60vh] overflow-hidden py-[10vh]"
                style={{ 
                    WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
                    maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)"
                }}
            >
                {filtered.map((h, i) => (
                    <div
                        key={i}
                        className="h-[2px] rounded-full transition-all duration-300 shrink-0"
                        style={{
                            width: activeIndex === i ? "20px" : `${20 - (h.level - 1) * 6}px`,
                            background: activeIndex === i ? "var(--primary)" : "var(--border)",
                            opacity: activeIndex === i ? 1 : 0.5,
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
                    {filtered.map((h, i) => (
                        <div
                            key={i}
                            onClick={() => handleClick(h.pos, i)}
                            className={`py-1 cursor-pointer transition-all duration-200 truncate rounded-lg
                                ${
                                    activeIndex === i
                                        ? "text-primary font-semibold bg-accent px-2 -ml-2"
                                        : "hover:text-foreground"
                                }`}
                            style={{
                                paddingLeft:
                                    activeIndex === i
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
    );
};
