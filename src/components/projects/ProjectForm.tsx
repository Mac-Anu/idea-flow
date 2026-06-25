"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, Trash2, ArrowLeft, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectsApi } from "@/api/projects";
import { TechBadge } from "@/components/projects/TechBadge";
import type { Project } from "@/server/projects/type";

/**
 * 项目编辑表单（后台用）。
 * 新建（project 为空）与编辑共用。图片走 /api/upload，技术栈以 chip 形式增删。
 *
 * @param project - 编辑时传入的现有项目；新建时不传
 */
export function ProjectForm({ project }: { project?: Project }) {
    const router = useRouter();
    const isEdit = !!project;

    const [title, setTitle] = useState(project?.title ?? "");
    const [description, setDescription] = useState(project?.description ?? "");
    const [imageUrl, setImageUrl] = useState(project?.imageUrl ?? "");
    const [gallery, setGallery] = useState<string[]>(project?.gallery ?? []);
    const [techStack, setTechStack] = useState<string[]>(project?.techStack ?? []);
    const [techInput, setTechInput] = useState("");
    const [liveUrl, setLiveUrl] = useState(project?.liveUrl ?? "");
    const [githubUrl, setGithubUrl] = useState(project?.githubUrl ?? "");
    const [featured, setFeatured] = useState(project?.featured ?? false);
    const [isPinned, setIsPinned] = useState(project?.isPinned ?? false);
    const [showOnHome, setShowOnHome] = useState(project?.showOnHome ?? false);
    const [published, setPublished] = useState(!!project?.publishedAt);

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || "图片上传失败");
                return;
            }
            const { url } = await res.json();
            setImageUrl(url);
            toast.success("图片已上传");
        } catch {
            toast.error("图片上传失败，请检查网络");
        } finally {
            setUploading(false);
        }
    };

    // 图集多图上传：逐个上传后追加到 gallery，单张失败不影响其余
    const uploadGallery = async (files: FileList) => {
        setGalleryUploading(true);
        try {
            const uploaded: string[] = [];
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    toast.error(err.error || `「${file.name}」上传失败`);
                    continue;
                }
                const { url } = await res.json();
                uploaded.push(url);
            }
            if (uploaded.length) {
                setGallery((prev) => [...prev, ...uploaded]);
                toast.success(`已添加 ${uploaded.length} 张图片`);
            }
        } catch {
            toast.error("图片上传失败，请检查网络");
        } finally {
            setGalleryUploading(false);
        }
    };

    const addTech = () => {
        const v = techInput.trim();
        if (!v) return;
        if (techStack.some((t) => t.toLowerCase() === v.toLowerCase())) {
            setTechInput("");
            return;
        }
        setTechStack([...techStack, v]);
        setTechInput("");
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("请填写项目标题");
            return;
        }
        setSaving(true);
        const payload = {
            title: title.trim(),
            description: description.trim(),
            imageUrl: imageUrl || undefined,
            gallery,
            techStack,
            liveUrl: liveUrl.trim() || undefined,
            githubUrl: githubUrl.trim() || undefined,
            featured,
            isPinned,
            showOnHome: published ? showOnHome : false,
            published,
        };
        try {
            const res = isEdit
                ? await projectsApi.update(project!.id, payload)
                : await projectsApi.create(payload);
            if (!res.ok) {
                toast.error(isEdit ? "更新失败" : "创建失败");
                return;
            }
            toast.success(isEdit ? "已保存" : "项目已创建");
            router.push("/manage/projects");
            router.refresh();
        } catch {
            toast.error("操作失败，请稍后重试");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEdit) return;
        if (!confirm(`确定删除项目「${project!.title}」吗？此操作不可恢复。`)) return;
        setDeleting(true);
        try {
            const res = await projectsApi.delete(project!.id);
            if (!res.ok) {
                toast.error("删除失败");
                return;
            }
            toast.success("项目已删除");
            router.push("/manage/projects");
            router.refresh();
        } catch {
            toast.error("删除失败，请稍后重试");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            {/* 顶部操作栏 */}
            <div className="mb-8 flex items-center justify-between">
                <button
                    onClick={() => router.push("/manage/projects")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回项目管理
                </button>
                <div className="flex items-center gap-2">
                    {isEdit && (
                        <Button variant="ghost" onClick={handleDelete} disabled={deleting} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            删除
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isEdit ? "保存" : "创建项目"}
                    </Button>
                </div>
            </div>

            <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
                {isEdit ? "编辑项目" : "新建项目"}
            </h1>

            <div className="space-y-6">
                {/* 封面图 */}
                <Field label="封面截图">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadImage(f);
                            e.target.value = "";
                        }}
                    />
                    {imageUrl ? (
                        <div className="group relative overflow-hidden rounded-2xl border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt="封面预览" className="aspect-[16/10] w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    <Upload className="h-3.5 w-3.5" />
                                    更换
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => setImageUrl("")}>
                                    <X className="h-3.5 w-3.5" />
                                    移除
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                        >
                            {uploading ? (
                                <Loader2 className="h-7 w-7 animate-spin" />
                            ) : (
                                <ImageIcon className="h-7 w-7" />
                            )}
                            <span className="text-sm">{uploading ? "上传中…" : "点击上传封面图"}</span>
                        </button>
                    )}
                </Field>

                {/* 项目图集（多图） */}
                <Field label="项目图集">
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length) uploadGallery(files);
                            e.target.value = "";
                        }}
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {gallery.map((url, i) => (
                            <div key={url} className="group relative overflow-hidden rounded-xl border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`项目图 ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setGallery(gallery.filter((u) => u !== url))}
                                    className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100"
                                    title="移除这张"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        {/* 追加上传按钮 */}
                        <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            disabled={galleryUploading}
                            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/50 text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                        >
                            {galleryUploading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <Plus className="h-6 w-6" />
                            )}
                            <span className="text-xs">{galleryUploading ? "上传中…" : "添加图片"}</span>
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">可一次选择多张，展示在项目详情页。</p>
                </Field>

                {/* 标题 */}
                <Field label="项目标题" required>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：创想流 - AI 知识管理平台" />
                </Field>

                {/* 简介 */}
                <Field label="项目简介">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="简单介绍这个项目做了什么、解决了什么问题、有什么亮点。"
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                    />
                </Field>

                {/* 技术栈 */}
                <Field label="技术栈">
                    <div className="flex gap-2">
                        <Input
                            value={techInput}
                            onChange={(e) => setTechInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTech();
                                }
                            }}
                            placeholder="输入技术名后回车，如 TypeScript"
                        />
                        <Button type="button" variant="outline" onClick={addTech}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    {techStack.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {techStack.map((t) => (
                                <span key={t} className="inline-flex items-center gap-1">
                                    <TechBadge name={t} />
                                    <button
                                        onClick={() => setTechStack(techStack.filter((x) => x !== t))}
                                        className="text-muted-foreground transition hover:text-destructive"
                                        title="移除"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </Field>

                {/* 链接 */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="在线演示 URL">
                        <Input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://…" />
                    </Field>
                    <Field label="源码仓库 URL">
                        <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/…" />
                    </Field>
                </div>

                {/* 发布开关 */}
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card/50 px-4 py-3">
                    <div>
                        <p className="text-sm font-medium text-foreground">发布项目</p>
                        <p className="text-xs text-muted-foreground">发布后才会出现在公开项目页；关闭则转为草稿</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={published}
                        onChange={(e) => setPublished(e.target.checked)}
                        className="h-5 w-5 accent-primary"
                    />
                </label>

                {/* 首页展示开关 */}
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card/50 px-4 py-3">
                    <div>
                        <p className="text-sm font-medium text-foreground">首页展示</p>
                        <p className="text-xs text-muted-foreground">勾选后优先展示在首页项目区；未发布项目不会出现在首页</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={published && showOnHome}
                        disabled={!published}
                        onChange={(e) => setShowOnHome(e.target.checked)}
                        className="h-5 w-5 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </label>

                {/* 置顶开关 */}
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card/50 px-4 py-3">
                    <div>
                        <p className="text-sm font-medium text-foreground">置顶</p>
                        <p className="text-xs text-muted-foreground">置顶项目在公开列表和首页优先展示</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="h-5 w-5 accent-primary"
                    />
                </label>

                {/* 精选开关 */}
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card/50 px-4 py-3">
                    <div>
                        <p className="text-sm font-medium text-foreground">设为精选</p>
                        <p className="text-xs text-muted-foreground">精选项目会带角标</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="h-5 w-5 accent-primary"
                    />
                </label>
            </div>
        </div>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
            </label>
            {children}
        </div>
    );
}
