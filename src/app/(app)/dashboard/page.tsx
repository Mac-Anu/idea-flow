import { articlesApi } from "@/api/articles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie") || "";

    const res = await articlesApi.list({
        headers: { cookie: cookieHeader },
    });

    if (!res.ok) {
        redirect("/sign-in?expired=1");
    }

    const { data: articles } = await res.json();

    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const userName = session?.user?.name || session?.user?.username || undefined;

    return <DashboardClient articles={articles} userName={userName} />;
}
