"use client";

import { cn } from "@/lib/utils";
import { Trash2, Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/article/editor/TiptapEditor";
import { TableOfContents } from "@/components/article/editor/TableOfContents";
import { useArticleEditor } from "@/components/article/hooks";
import type { Article } from "@/server/articles/type";

export const ArticleEditor = ({ article }: { article: Article }) => {
    const {
        title,
        content,
        isSaving,
        saved,
        headings,
        editor,
        titleRef,
        setTitle,
        setContent,
        setHeadings,
        setEditor,
        updateActiveArticleTitle,
        handleTitleKeyDown,
        handleSave,
        handleDelete,
    } = useArticleEditor(article);

    return (
        <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex flex-col gap-5 border-b border-black/6 pb-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b8f80]">
                        Writing Desk
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#1f1d1a] lg:text-3xl">
                        {title || "无标题"}
                    </h1>
                </div>

                <div className="flex items-center gap-3 self-start lg:self-auto">
                    {saved ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                            <Check size={14} strokeWidth={2.4} />
                            已保存
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-[#8a6a2f]">
                            <Clock3 size={14} strokeWidth={2.2} />
                            草稿编辑中
                        </span>
                    )}

                    <button
                        onClick={handleDelete}
                        className={cn(
                            "rounded-2xl border border-transparent p-2.5 text-[#9b8f80] transition-all duration-200",
                            "hover:border-red-100 hover:bg-red-50 hover:text-red-500",
                        )}
                        title="移至回收站"
                    >
                        <Trash2 size={17} />
                    </button>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-11 rounded-2xl bg-[#1f1d1a] px-5 text-white shadow-sm transition hover:bg-[#2b2620]"
                    >
                        {isSaving ? "保存中..." : "保存文章"}
                    </Button>
                </div>
            </div>

            <div className="rounded-[28px] border border-black/5 bg-white/70 px-6 py-8 shadow-[0_18px_40px_rgba(33,24,14,0.04)] lg:px-10 lg:py-10">
                <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        updateActiveArticleTitle(e.target.value);
                    }}
                    onKeyDown={handleTitleKeyDown}
                    placeholder="无标题"
                    className={cn(
                        "mb-6 w-full border-none bg-transparent text-[36px] font-bold leading-[1.1] tracking-tight outline-none lg:text-[40px]",
                        "text-[#171411] placeholder:text-[#c7b9a5]",
                    )}
                />

                <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-[#8a8074]">
                    <span className="rounded-full border border-black/6 bg-[#faf6ef] px-3 py-1">项目复盘</span>
                    <span className="rounded-full border border-black/6 bg-[#faf6ef] px-3 py-1">技术思考</span>
                    <span className="rounded-full border border-black/6 bg-[#faf6ef] px-3 py-1">求职展示</span>
                </div>

                <TiptapEditor
                    content={content}
                    onChange={(newContent) => setContent(newContent)}
                    onHeadingsChange={(newHeadings) => setHeadings(newHeadings)}
                    onEditorReady={(e) => setEditor(e)}
                />
                <TableOfContents headings={headings} editor={editor} />
            </div>
        </div>
    );
};