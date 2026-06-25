import { ProfileSidebar, type SidebarProfile } from "@/components/layout/ProfileSidebar";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSiteProfile } from "@/server/site/service";
import { profileConfig } from "@/config/profile";

/**
 * 公开站点布局：左侧固定 Profile 侧边栏 + 右侧内容区。
 * 首页、博客列表、项目、速查表、学习笔记、关于页共用此布局。
 * 登录态与站点 Profile 只在这里读一次，传给侧边栏。
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({ headers: await headers() });
    const isLoggedIn = !!session?.user;

    let dbProfile: Awaited<ReturnType<typeof getSiteProfile>> | null = null;
    try {
        dbProfile = await getSiteProfile();
    } catch (e) {
        console.warn("Failed to load site profile in layout.", e);
    }

    // 组装侧边栏数据：site_profile 优先，缺省降级到静态 profileConfig。
    // 头像优先级：登录用户头像 > site_profile.avatar > 静态配置头像。
    const profile: SidebarProfile = {
        name: dbProfile?.name || profileConfig.name,
        title: dbProfile?.title || profileConfig.title,
        bio: dbProfile?.bio || profileConfig.bio,
        avatar: session?.user?.image || dbProfile?.avatar || profileConfig.avatar,
        socials:
            dbProfile?.socials && dbProfile.socials.length > 0
                ? dbProfile.socials
                : profileConfig.socials.map((s) => ({ label: s.label, href: s.href, iconKey: s.label.toLowerCase() })),
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <div className="flex min-h-screen w-full flex-col lg:flex-row">
                {/* 桌面端固定侧边栏 */}
                <div className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-border lg:flex">
                    <ProfileSidebar isLoggedIn={isLoggedIn} profile={profile} />
                </div>

                {/* 内容区 */}
                <main className="relative min-w-0 flex-1">
                    <div className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-10 lg:py-10">
                        {/* 移动端导航（lg 以下显示） */}
                        <PublicMobileNav isLoggedIn={isLoggedIn} profile={profile} />
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
