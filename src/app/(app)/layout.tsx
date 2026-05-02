import { Sidebar } from "@/components/layout/Sidebar";
import { articlesApi } from "@/api/articles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const res = await articlesApi.list({
        headers: { cookie: headersList.get("cookie") || "" },
    });

    if (!res.ok) {
        // 服务端一旦发现没有获取数据的权限，立刻发起硬跳转让你去登录
        redirect("/sign-in");
    }
    const { data: articles } = await res.json();

    return (
        <div className="min-h-screen bg-[#f5f1ea] text-[#1f1d1a] selection:bg-amber-100 selection:text-[#1f1d1a]">
            <div className="mx-auto flex min-h-screen w-full max-w-[1440px] gap-6 px-4 py-4 lg:px-6 lg:py-6">
                <Sidebar articles={articles} />

                <main className="relative flex-1 overflow-y-auto rounded-[32px] border border-black/5 bg-[#fffdf8] shadow-[0_20px_60px_rgba(33,24,14,0.06)]">
                    <div className="mx-auto h-full max-w-5xl px-6 py-8 lg:px-12 lg:py-10">{children}</div>
                </main>
            </div>
        </div>
    );
}
