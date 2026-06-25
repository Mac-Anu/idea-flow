import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { projectsApi } from "@/api/projects";
import { ProjectsManagerClient } from "./ProjectsManagerClient";
import type { Project } from "@/server/projects/type";

export default async function ProjectsManagerPage() {
    const headersList = await headers();
    const res = await projectsApi.list({ headers: { cookie: headersList.get("cookie") || "" } });

    if (!res.ok) {
        redirect("/sign-in?expired=1");
    }
    const { data } = await res.json();

    return <ProjectsManagerClient initialProjects={data as Project[]} />;
}
