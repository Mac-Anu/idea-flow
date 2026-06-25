"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BookOpen,
    FolderGit2,
    Zap,
    GraduationCap,
    User,
    Sun,
    Moon,
    PenSquare,
    LogIn,
    Github,
    Mail,
    Globe,
    Twitter,
    Linkedin,
    Link as LinkIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/**
 * 侧边栏 Profile 数据（由 (public)/layout 组装后传入）。
 * 头像已在 layout 按"登录头像 > site_profile > 静态配置"优先级算好。
 */
export interface SidebarProfile {
    name: string;
    title: string;
    bio: string;
    avatar: string;
    socials: { label: string; href: string; iconKey: string }[];
}

/** 社媒 iconKey → 图标组件映射，未命中用通用链接图标 */
const SOCIAL_ICONS: Record<string, ComponentType<{ size?: number | string; className?: string }>> = {
    github: Github,
    mail: Mail,
    email: Mail,
    globe: Globe,
    website: Globe,
    twitter: Twitter,
    x: Twitter,
    linkedin: Linkedin,
};

const NAV_ITEMS = [
    { label: "首页", href: "/", icon: Home, match: (p: string) => p === "/" },
    { label: "博客", href: "/blog", icon: BookOpen, match: (p: string) => p.startsWith("/blog") },
    { label: "项目", href: "/projects", icon: FolderGit2, match: (p: string) => p.startsWith("/projects") },
    { label: "速查表", href: "/cheatsheet", icon: Zap, match: (p: string) => p.startsWith("/cheatsheet") },
    { label: "学习笔记", href: "/learn", icon: GraduationCap, match: (p: string) => p.startsWith("/learn") },
    { label: "关于", href: "/about", icon: User, match: (p: string) => p.startsWith("/about") },
];

export function ProfileSidebar({ isLoggedIn, profile }: { isLoggedIn: boolean; profile: SidebarProfile }) {
    const pathname = usePathname();
    const initial = profile.name?.charAt(0).toUpperCase() || "U";

    return (
        <aside className="flex h-full w-full flex-col overflow-y-auto bg-card/60 px-5 py-7 backdrop-blur-xl">
            {/* 头像 + 名字 + 头衔 */}
            <div className="flex flex-col items-center text-center">
                {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="h-20 w-20 rounded-2xl border border-border object-cover shadow-sm"
                    />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-primary/10 text-2xl font-semibold text-primary shadow-sm">
                        {initial}
                    </div>
                )}
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{profile.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{profile.title}</p>
                <p className="mt-3 px-2 text-xs leading-relaxed text-muted-foreground/80">{profile.bio}</p>
            </div>

            {/* 社媒链接 */}
            {profile.socials.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {profile.socials.map((s) => {
                        const Icon = SOCIAL_ICONS[s.iconKey?.toLowerCase()] ?? LinkIcon;
                        return (
                            <a
                                key={s.label}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={s.label}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                            >
                                <Icon size={16} />
                            </a>
                        );
                    })}
                </div>
            )}

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* 栏目导航 */}
            <nav className="flex flex-1 flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                    const active = item.match(pathname);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all",
                                active
                                    ? "border border-primary/40 bg-accent/40 text-foreground shadow-sm"
                                    : "border border-transparent text-muted-foreground hover:border-border hover:bg-accent/20 hover:text-foreground",
                            )}
                        >
                            <item.icon size={16} className={cn("shrink-0", active ? "text-primary" : "opacity-70")} />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* 底部：主题切换 + 登录/工作台 */}
            <div className="mt-6 space-y-1 border-t border-border pt-4">
                <SidebarThemeToggle />
                <Link
                    href={isLoggedIn ? "/articles" : "/sign-in"}
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                >
                    <span className="shrink-0 opacity-70">
                        {isLoggedIn ? <PenSquare size={16} /> : <LogIn size={16} />}
                    </span>
                    <span className="truncate">{isLoggedIn ? "进入工作台" : "登录"}</span>
                </Link>
            </div>
        </aside>
    );
}

function SidebarThemeToggle() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
        >
            <span className="shrink-0 opacity-70">{isDark ? <Sun size={16} /> : <Moon size={16} />}</span>
            <span className="truncate">{isDark ? "切换白天模式" : "切换夜间模式"}</span>
        </button>
    );
}
