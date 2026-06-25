import Link from "next/link";
import { ArrowRight, FolderGit2, FileText } from "lucide-react";
import { queryLatestPublishedArticles } from "@/server/articles/service";
import { queryLatestPublicProjects } from "@/server/projects/service";
import { getSiteProfile } from "@/server/site/service";
import { ArticleThumbCard } from "@/components/home/ArticleThumbCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { profileConfig } from "@/config/profile";
import type { Article } from "@/server/articles/type";
import type { Project } from "@/server/projects/type";

export default async function HomePage() {
    let articles: Article[] = [];
    let projects: Project[] = [];
    let profile: Awaited<ReturnType<typeof getSiteProfile>> | null = null;

    try {
        [articles, projects, profile] = await Promise.all([
            queryLatestPublishedArticles(3) as unknown as Promise<Article[]>,
            queryLatestPublicProjects(3) as unknown as Promise<Project[]>,
            getSiteProfile(),
        ]);
    } catch (e) {
        console.warn("Failed to load home data during build/SSR.", e);
    }

    // site_profile 为空时降级到静态配置
    const headline = profile?.headline || `Hi, I'm ${profileConfig.name} 👋`;
    const intro = profile?.intro || profileConfig.bio;
    const bannerImage = profile?.bannerImage;

    return (
        <div className="space-y-16">
            {/* ===== 版头 ===== */}
            <section className="relative overflow-hidden rounded-[28px] border border-border bg-card">
                {bannerImage && (
                    <div className="absolute inset-0 -z-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={bannerImage} alt="" className="h-full w-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/40" />
                    </div>
                )}
                <div className="px-8 py-12 md:px-12 md:py-16">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                        {headline}
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg whitespace-pre-line">
                        {intro}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-110"
                        >
                            <FileText className="h-4 w-4" />
                            阅读博客
                        </Link>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/30 hover:bg-accent"
                        >
                            <FolderGit2 className="h-4 w-4" />
                            查看项目
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== Latest Articles ===== */}
            <section>
                <SectionHeader title="最新文章" subtitle="Latest Articles" href="/blog" hasItems={articles.length > 0} />
                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {articles.map((a, i) => (
                            <ArticleThumbCard key={a.id} article={a} index={i} />
                        ))}
                    </div>
                ) : (
                    <EmptyHint icon={<FileText className="h-7 w-7" />} text="还没有发布文章" />
                )}
            </section>

            {/* ===== What I've been working on ===== */}
            <section>
                <SectionHeader
                    title="近期项目"
                    subtitle="What I've been working on"
                    href="/projects"
                    hasItems={projects.length > 0}
                />
                {projects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((p) => (
                            <ProjectCard key={p.id} project={p} />
                        ))}
                    </div>
                ) : (
                    <EmptyHint icon={<FolderGit2 className="h-7 w-7" />} text="还没有发布项目" />
                )}
            </section>
        </div>
    );
}

function SectionHeader({
    title,
    subtitle,
    href,
    hasItems,
}: {
    title: string;
    subtitle: string;
    href: string;
    hasItems: boolean;
}) {
    return (
        <div className="mb-6 flex items-end justify-between">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {hasItems && (
                <Link
                    href={href}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
                >
                    查看全部
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            )}
        </div>
    );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center rounded-[20px] border border-dashed border-border py-16 text-center text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">{icon}</div>
            <p className="mt-4 text-sm">{text}</p>
        </div>
    );
}
