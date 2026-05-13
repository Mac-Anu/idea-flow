"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus, X, Globe, GlobeLock } from "lucide-react";
import { TiptapEditor } from "@/components/article/editor/TiptapEditor";
import { TableOfContents } from "@/components/article/editor/TableOfContents";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useArticleEditor } from "@/components/article/hooks";
import type { Article } from "@/server/articles/type";

export const ArticleEditor = ({ article, highlight }: { article: Article; highlight?: string }) => {
    const {
        title,
        content,
        tags,
        isSaving,
        saved,
        isPublished,
        isPublishing,
        headings,
        editor,
        titleRef,
        setTitle,
        setContent,
        setTags,
        setHeadings,
        setEditor,
        updateActiveArticleTitle,
        handleTitleKeyDown,
        handleSave,
        handleDelete,
        handlePublish,
        handleUnpublish,
    } = useArticleEditor(article);

    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState("");

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && newTag.trim()) {
            e.preventDefault();
            const tagValue = newTag.trim();
            if (!tags.includes(tagValue)) {
                setTags([...tags, tagValue]);
            }
            setNewTag("");
            setIsAddingTag(false);
        } else if (e.key === "Escape") {
            setNewTag("");
            setIsAddingTag(false);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    return (
        <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex flex-col gap-5 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Writing Desk
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                        {title || "无标题"}
                    </h1>
                </div>

                <div className="flex items-center gap-3 self-start lg:self-auto">
                    {/* 发布状态与按钮 */}
                    {isPublished ? (
                        <button
                            onClick={handleUnpublish}
                            disabled={isPublishing}
                            className={cn(
                                "group flex w-[110px] items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                                "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                "hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive dark:hover:text-red-400",
                                isPublishing && "opacity-50 cursor-not-allowed",
                            )}
                            title="点击取消发布"
                        >
                            {isPublishing ? (
                                <>
                                    <Globe size={15} />
                                    <span>处理中...</span>
                                </>
                            ) : (
                                <>
                                    <span className="flex items-center gap-2 group-hover:hidden">
                                        <Globe size={15} />
                                        已发布
                                    </span>
                                    <span className="hidden items-center gap-2 group-hover:flex">
                                        <X size={15} />
                                        取消发布
                                    </span>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className={cn(
                                "flex w-[110px] items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                                "border-primary/20 bg-primary/10 text-primary",
                                "hover:bg-primary/20 hover:shadow-[0_4px_16px_rgba(0,200,255,0.15)]",
                                isPublishing && "opacity-50 cursor-not-allowed",
                            )}
                            title="发布到公开博客"
                        >
                            <GlobeLock size={15} />
                            {isPublishing ? "发布中..." : "发布"}
                        </button>
                    )}

                    <button
                        onClick={handleDelete}
                        className={cn(
                            "rounded-2xl border border-transparent p-2.5 text-muted-foreground transition-all duration-200",
                            "hover:bg-destructive/10 hover:text-destructive",
                        )}
                        title="移至回收站"
                    >
                        <Trash2 size={17} />
                    </button>
                    
                    <div className="h-6 w-px bg-border/60 mx-1"></div>
                    <ThemeToggle />
                </div>
            </div>

            <div className="mt-4 lg:px-4">
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
                        "text-foreground placeholder:text-muted-foreground/50",
                    )}
                />

                <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {tags.map((tag) => (
                        <span key={tag} className="group flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 transition-colors hover:bg-muted">
                            {tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    
                    {isAddingTag ? (
                        <input
                            autoFocus
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleAddTag}
                            onBlur={() => {
                                setIsAddingTag(false);
                                setNewTag("");
                            }}
                            className="rounded-full border border-border bg-background px-3 py-1 text-sm outline-none w-24 text-foreground focus:border-primary"
                            placeholder="输入标签..."
                        />
                    ) : (
                        <button
                            onClick={() => setIsAddingTag(true)}
                            className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        >
                            <Plus size={14} /> 添加标签
                        </button>
                    )}
                </div>

                <TiptapEditor
                    content={content}
                    onChange={(newContent) => setContent(newContent)}
                    onHeadingsChange={(newHeadings) => setHeadings(newHeadings)}
                    onEditorReady={(e) => setEditor(e)}
                    highlight={highlight}
                />
                <TableOfContents headings={headings} editor={editor} />
            </div>
        </div>
    );
};