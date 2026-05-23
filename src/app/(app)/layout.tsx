import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { articlesApi } from "@/api/articles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsModal } from "@/components/user-center/SettingsModal";
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
            <div className="flex flex-col lg:flex-row h-screen w-full">
                <div className="hidden lg:flex w-[260px] shrink-0 border-r border-border bg-background">
                    <Sidebar articles={articles} />
                </div>
                
                <MobileNav articles={articles} />

                <main className="relative flex-1 overflow-y-auto bg-background">
                    <div className="h-full w-full px-6 py-8 lg:px-12 lg:py-10">{children}</div>
                </main>
                
                {/* 挂载全局巨型设置弹窗 */}
                <SettingsModal />
            </div>
        </div>
    );
}
