import { FolderGit2 } from "lucide-react";
import type { Metadata } from "next";
import { queryPublicProjects } from "@/server/projects/service";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import type { Project } from "@/server/projects/type";

export const metadata: Metadata = {
    title: "项目 - 创想流",
    description: "我的项目作品集：技术栈、源码与在线演示。",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
    let projects: Project[] = [];
    try {
        projects = (await queryPublicProjects()) as unknown as Project[];
    } catch (e) {
        console.warn("Failed to fetch projects during build/SSR.", e);
    }

    return (
        <div>
            <header className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">项目</h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                    这里是我做过的一些项目。点开任意一个查看技术栈、设计思路与在线演示。
                </p>
            </header>

            {projects.length > 0 ? (
                <ProjectGrid projects={projects} />
            ) : (
                <div className="flex flex-col items-center py-24 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card shadow-sm">
                        <FolderGit2 className="h-9 w-9 text-primary" />
                    </div>
                    <h2 className="mt-6 text-xl font-semibold text-foreground">还没有项目</h2>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        项目作品会在这里展示。登录后台即可添加你的第一个项目。
                    </p>
                </div>
            )}
        </div>
    );
}
