import { Metadata } from "next";
import { notFound } from "next/navigation";
import { queryProjectItem } from "@/server/projects/service";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import type { Project } from "@/server/projects/type";

async function getProject(slug: string): Promise<Project | null> {
    try {
        return (await queryProjectItem(slug)) as unknown as Project | null;
    } catch (e) {
        console.error("Failed to query project:", e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const project = await getProject(slug);
    if (!project) return { title: "项目不存在 - 创想流" };
    return {
        title: `${project.title} - 创想流`,
        description: project.description?.slice(0, 160) || undefined,
    };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = await getProject(slug);

    if (!project) {
        notFound();
    }

    return <ProjectDetail project={project} />;
}
