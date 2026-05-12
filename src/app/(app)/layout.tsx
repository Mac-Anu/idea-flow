import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { articlesApi } from "@/api/articles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const res = await articlesApi.list({
        headers: { cookie: headersList.get("cookie") || "" },
    });

    if (!res.ok) {
        // 服务端一旦发现没有获取数据的权限，携带 expired 标志跳转到登录页
        // 配合 middleware，可以实现静默清除无效 Cookie，完美解决鬼打墙问题
        redirect("/sign-in?expired=1");
    }
    const { data: articles } = await res.json();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto flex flex-col lg:flex-row min-h-screen w-full max-w-[1440px] gap-4 lg:gap-6 px-4 py-4 lg:px-6 lg:py-6">
                <div className="hidden lg:block shrink-0">
                    <Sidebar articles={articles} />
                </div>
                
                <MobileNav articles={articles} />

                <main className="relative flex-1 overflow-y-auto rounded-[32px] border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                    <div className="mx-auto h-full max-w-5xl px-6 py-8 lg:px-12 lg:py-10">{children}</div>
                </main>
            </div>
        </div>
    );
}
