"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Github, ExternalLink, Star, FolderGit2 } from "lucide-react";
import { TechBadge } from "./TechBadge";
import type { Project } from "@/server/projects/type";

/**
 * 项目卡片。
 * 鼠标悬停时：封面图轻微放大 + "查看项目"遮罩淡入，整卡上浮（framer-motion）。
 * 参考设计图 7 的交互效果。
 */
export function ProjectCard({ project }: { project: Project }) {
    const href = `/projects/${project.slug || project.id}`;

    return (
        <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="group relative overflow-hidden rounded-[20px] border border-border bg-card shadow-sm transition-colors hover:border-primary/30 hover:shadow-lg"
        >
            <Link href={href} className="block">
                {/* 封面图 */}
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {project.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                            <FolderGit2 size={48} />
                        </div>
                    )}

                    {/* 精选角标 */}
                    {project.featured && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm backdrop-blur">
                            <Star className="h-3 w-3 fill-current" />
                            精选
                        </span>
                    )}

                    {/* 悬停遮罩 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black shadow-lg">
                            查看项目
                            <ArrowUpRight className="h-4 w-4" />
                        </span>
                    </div>
                </div>
            </Link>

            {/* 内容 */}
            <div className="p-5">
                <Link href={href}>
                    <h3 className="text-lg font-semibold tracking-tight text-card-foreground transition-colors group-hover:text-primary">
                        {project.title}
                    </h3>
                </Link>
                {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {project.description}
                    </p>
                )}

                {/* 技术栈 */}
                {project.techStack && project.techStack.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {project.techStack.slice(0, 5).map((t) => (
                            <TechBadge key={t} name={t} size={13} />
                        ))}
                    </div>
                )}

                {/* 链接 */}
                {(project.githubUrl || project.liveUrl) && (
                    <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
                        {project.githubUrl && (
                            <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                            >
                                <Github className="h-3.5 w-3.5" />
                                源码
                            </a>
                        )}
                        {project.liveUrl && (
                            <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-primary"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                演示
                            </a>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
