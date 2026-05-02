"use client";
import { Editor } from "@tiptap/react";
import { useState } from "react";
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
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const handleClick = (pos: number, index: number) => {
        if (!editor) return;
        setActiveIndex(index);
        const { node } = editor.view.domAtPos(pos + 1);
        const el = node instanceof HTMLElement ? node : node.parentElement;
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const filtered = headings.filter((h) => h.level <= 3);
    if (filtered.length === 0) return null;
    return (
        <div className="group fixed right-6 xl:right-10 top-1/2 -translate-y-1/2 z-50">
            {/* 竖线指示器（默认显示，hover 时隐藏） */}
            <div className="flex flex-col gap-3.5 items-end transition-opacity duration-300 group-hover:opacity-0 cursor-pointer">
                {filtered.map((h, i) => (
                    <div
                        key={i}
                        className="h-[2px] rounded-full bg-[#d9ccb7]"
                        style={{ width: `${20 - (h.level - 1) * 6}px` }}
                    />
                ))}
            </div>
            
            {/* TOC 面板（默认隐藏，hover 时滑入） */}
            <div
                className="absolute right-0 top-1/2 -translate-y-1/2
                opacity-0 pointer-events-none translate-x-4
                group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0
                transition-all duration-300 ease-out
                bg-[rgba(255,251,245,0.95)] backdrop-blur-md border border-black/5 rounded-[20px] shadow-[0_20px_50px_rgba(33,24,14,0.06)] p-5 
                min-w-[180px] max-w-[260px]
                text-[13px] text-[#6b6258] leading-relaxed max-h-[70vh] overflow-y-auto"
            >
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#b5a793] mb-3 select-none">
                    Contents
                </p>
                <div className="space-y-1.5">
                    {filtered.map((h, i) => (
                        <div
                            key={i}
                            className={`py-1 cursor-pointer transition-colors truncate rounded-lg 
                                ${
                                    activeIndex === i 
                                        ? "text-[#8a6a2f] font-semibold bg-[#f3ead8] px-2 -ml-2" 
                                        : "hover:text-[#2d261f]"
                                }`}
                            style={{ 
                                paddingLeft: activeIndex === i ? `${(h.level - 1) * 12 + 8}px` : `${(h.level - 1) * 12}px` 
                            }}
                            onClick={() => handleClick(h.pos, i)}
                        >
                            {h.text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
