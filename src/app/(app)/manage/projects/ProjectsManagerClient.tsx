"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, FolderGit2, Loader2, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectsApi } from "@/api/projects";
import type { Project } from "@/server/projects/type";

/**
 * 后台项目管理列表（客户端）。
 * 列出当前用户的项目，支持新建、编辑、删除。
 */
export function ProjectsManagerClient({ initialProjects }: { initialProjects: Project[] }) {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleNew = async () => {
        setCreating(true);
        try {
            const res = await projectsApi.create({ title: "未命名项目", description: "" });
            if (!res.ok) {
                toast.error("创建失败");
                return;
            }
            const { newProject } = await res.json();
            router.push(`/manage/projects/${newProject.id}`);
        } catch {
            toast.error("创建失败，请稍后重试");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, p: Project) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`确定删除项目「${p.title}」吗？此操作不可恢复。`)) return;
        setDeletingId(p.id);
        try {
            const res = await projectsApi.delete(p.id);
            if (!res.ok) {
                toast.error("删除失败");
                return;
            }
            setProjects((prev) => prev.filter((x) => x.id !== p.id));
            toast.success("项目已删除");
        } catch {
            toast.error("删除失败，请稍后重试");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">项目管理</h1>
                    <p className="mt-1 text-sm text-muted-foreground">管理你的项目作品，它们会展示在公开的项目页。</p>
                </div>
                <Button onClick={handleNew} disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    新建项目
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center rounded-[24px] border border-dashed border-border py-20 text-center">
                    <FolderGit2 className="h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">还没有项目，点右上角「新建项目」开始。</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {projects.map((p) => (
                        <Link
                            key={p.id}
                            href={`/manage/projects/${p.id}`}
                            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm"
                        >
                            {/* 缩略图 */}
                            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                {p.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                                        <FolderGit2 size={20} />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="truncate font-medium text-foreground group-hover:text-primary">{p.title}</h3>
                                    {p.featured && (
                                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                            <Star className="h-2.5 w-2.5 fill-current" />
                                            精选
                                        </span>
                                    )}
                                </div>
                                {p.description && (
                                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{p.description}</p>
                                )}
                                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground/70">
                                    {p.techStack && p.techStack.length > 0 && <span>{p.techStack.slice(0, 4).join(" · ")}</span>}
                                    {p.liveUrl && <ExternalLink className="h-3 w-3" />}
                                    {p.githubUrl && <Github className="h-3 w-3" />}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition group-hover:bg-accent group-hover:text-foreground">
                                    <Pencil className="h-4 w-4" />
                                </span>
                                <button
                                    onClick={(e) => handleDelete(e, p)}
                                    disabled={deletingId === p.id}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                    title="删除"
                                >
                                    {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
