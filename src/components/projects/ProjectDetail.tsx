import Link from "next/link";
import { ArrowLeft, Github, ExternalLink, Star } from "lucide-react";
import { TechBadgeList } from "./TechBadge";
import type { Project } from "@/server/projects/type";

/**
 * 项目详情页内容。
 * 返回按钮 + 标题 + 简介 + 技术栈图标行 + 源码/演示链接 + 大截图。
 * 对应设计图 8 的版式。
 */
export function ProjectDetail({ project }: { project: Project }) {
    return (
        <article className="mx-auto max-w-3xl">
            {/* 返回 */}
            <Link
                href="/projects"
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                返回项目列表
            </Link>

            {/* 标题区 */}
            <div className="mb-6">
                {project.featured && (
                    <span className="mb-4 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <Star className="h-3 w-3 fill-current" />
                        精选项目
                    </span>
                )}
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
                    {project.title}
                </h1>
                {project.description && (
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        {project.description}
                    </p>
                )}
            </div>

            {/* 技术栈 */}
            {project.techStack && project.techStack.length > 0 && (
                <div className="mb-6">
                    <TechBadgeList items={project.techStack} size={15} />
                </div>
            )}

            {/* 链接 */}
            {(project.githubUrl || project.liveUrl) && (
                <div className="mb-10 flex flex-wrap items-center gap-3">
                    {project.liveUrl && (
                        <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-110"
                        >
                            <ExternalLink className="h-4 w-4" />
                            在线演示
                        </a>
                    )}
                    {project.githubUrl && (
                        <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/30 hover:bg-accent"
                        >
                            <Github className="h-4 w-4" />
                            查看源码
                        </a>
                    )}
                </div>
            )}

            {/* 大截图 */}
            {project.imageUrl && (
                <div className="overflow-hidden rounded-[20px] border border-border shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={project.imageUrl} alt={project.title} className="w-full" />
                </div>
            )}

            {/* 项目图集 */}
            {project.gallery && project.gallery.length > 0 && (
                <div className="mt-6 space-y-4">
                    {project.gallery.map((url, i) => (
                        <div key={url} className="overflow-hidden rounded-[20px] border border-border shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`${project.title} 图 ${i + 1}`} className="w-full" />
                        </div>
                    ))}
                </div>
            )}
        </article>
    );
}
