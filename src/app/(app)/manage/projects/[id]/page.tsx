import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { projectsApi } from "@/api/projects";
import { ProjectForm } from "@/components/projects/ProjectForm";
import type { Project } from "@/server/projects/type";

export default async function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const headersList = await headers();
    const res = await projectsApi.detail(id, { headers: { cookie: headersList.get("cookie") || "" } });

    if (!res.ok) {
        notFound();
    }
    const { project } = await res.json();

    return <ProjectForm project={project as Project} />;
}
