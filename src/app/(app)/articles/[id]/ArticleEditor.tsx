"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Trash2, Plus, X, Globe, GlobeLock, Maximize, Minimize, Pin, PinOff, ImageIcon, Upload, Loader2, Home } from "lucide-react";
import { TiptapEditor } from "@/components/article/editor/TiptapEditor";
import { TableOfContents } from "@/components/article/editor/TableOfContents";
import { GradientCover } from "@/components/home/GradientCover";
import { useArticleEditor } from "@/components/article/hooks";
import type { Article } from "@/server/articles/type";

export const ArticleEditor = ({ article, highlight }: { article: Article; highlight?: string }) => {
    const {
        title,
        content,
        tags,
        imageUrl,
        saveStatus,
        isPublished,
        isPublishing,
        isPinned,
        isPinning,
        showOnHome,
        isTogglingHome,
        headings,
        editor,
        titleRef,
        setTitle,
        setContent,
        setTags,
        setImageUrl,
        setHeadings,
        setEditor,
        updateActiveArticleTitle,
        handleTitleKeyDown,
        handleDelete,
        handlePublish,
        handleUnpublish,
        handleTogglePin,
        handleToggleHomeVisibility,
    } = useArticleEditor(article);

    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [isFullWidth, setIsFullWidth] = useState(false);
    const [uploading, setUploading] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const uploadCover = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "封面上传失败");
                return;
            }
            const { url } = await res.json();
            setImageUrl(url);
            toast.success("封面已上传");
        } catch {
            toast.error("封面上传失败，请检查网络");
        } finally {
            setUploading(false);
        }
    };

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
        <div className={cn("mx-auto transition-all duration-300", isFullWidth ? "max-w-[95%] lg:max-w-[90%]" : "max-w-4xl")}>
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
                    {/* 保存状态：让用户看得见。最关键是 error——失败了必须告诉用户，
                        否则他以为存了、关掉页面这段就丢了 */}
                    {saveStatus === "saving" && (
                        <span className="text-sm text-muted-foreground">保存中…</span>
                    )}
                    {saveStatus === "saved" && (
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">已保存</span>
                    )}
                    {saveStatus === "error" && (
                        <span className="text-sm font-medium text-destructive">保存失败，重试中…</span>
                    )}

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
                                "hover:bg-primary/20 hover:shadow-[0_4px_16px_oklch(0.7_0.19_40_/_0.15)]",
                                isPublishing && "opacity-50 cursor-not-allowed",
                            )}
                            title="发布到公开博客"
                        >
                            <GlobeLock size={15} />
                            {isPublishing ? "发布中..." : "发布"}
                        </button>
                    )}

                    {/* 置顶按钮：仅已发布文章可置顶 */}
                    {isPublished && (
                        <button
                            onClick={handleTogglePin}
                            disabled={isPinning}
                            className={cn(
                                "flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                                isPinned
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                                    : "border-border text-muted-foreground hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400",
                                isPinning && "opacity-50 cursor-not-allowed",
                            )}
                            title={isPinned ? "点击取消置顶" : "置顶到博客精选位"}
                        >
                            {isPinned ? <Pin size={15} className="fill-current" /> : <PinOff size={15} />}
                            {isPinning ? "处理中..." : isPinned ? "已置顶" : "置顶"}
                        </button>
                    )}

                    {/* 首页展示按钮：仅已发布文章可加入首页 */}
                    {isPublished && (
                        <button
                            onClick={handleToggleHomeVisibility}
                            disabled={isTogglingHome}
                            className={cn(
                                "flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                                showOnHome
                                    ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary",
                                isTogglingHome && "opacity-50 cursor-not-allowed",
                            )}
                            title={showOnHome ? "从首页移除" : "展示到首页文章区"}
                        >
                            <Home size={15} className={showOnHome ? "fill-current" : undefined} />
                            {isTogglingHome ? "处理中..." : showOnHome ? "已在首页" : "首页展示"}
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
                    <button
                        onClick={() => setIsFullWidth(!isFullWidth)}
                        className={cn(
                            "rounded-2xl border border-transparent p-2.5 transition-all duration-200",
                            isFullWidth ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        )}
                        title={isFullWidth ? "退出宽屏" : "宽屏模式"}
                    >
                        {isFullWidth ? <Minimize size={17} /> : <Maximize size={17} />}
                    </button>
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

                {/* 封面图：有图显示预览，可更换/移除；无图显示按标题生成的渐变占位 + 上传按钮 */}
                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCover(f);
                        e.target.value = "";
                    }}
                />
                <div className="group relative mb-6 aspect-[16/7] w-full overflow-hidden rounded-2xl border border-border">
                    {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="文章封面" className="h-full w-full object-cover" />
                    ) : (
                        <div className="relative h-full w-full">
                            <GradientCover seed={article.slug || article.id || title} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/90">
                                <ImageIcon className="h-7 w-7" />
                                <span className="text-sm">默认封面（按标题生成）</span>
                            </div>
                        </div>
                    )}
                    {/* 悬停操作层 */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow transition hover:bg-white disabled:opacity-60"
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {uploading ? "上传中…" : imageUrl ? "更换封面" : "上传封面"}
                        </button>
                        {imageUrl && (
                            <button
                                onClick={() => setImageUrl("")}
                                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow transition hover:bg-white"
                            >
                                <X className="h-4 w-4" />
                                移除
                            </button>
                        )}
                    </div>
                </div>

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
                    onExtractTitle={(extractedTitle) => {
                        setTitle(extractedTitle);
                        updateActiveArticleTitle(extractedTitle);
                    }}
                    highlight={highlight}
                />
                <TableOfContents headings={headings} editor={editor} />
            </div>
        </div>
    );
};
