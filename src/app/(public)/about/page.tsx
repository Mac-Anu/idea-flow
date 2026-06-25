import { Metadata } from "next";
import { Github, Mail, Globe, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import type { ComponentType } from "react";
import { profileConfig } from "@/config/profile";
import { getSiteProfile } from "@/server/site/service";

export const metadata: Metadata = {
    title: `关于 - 创想流`,
    description: profileConfig.bio,
};

export const dynamic = "force-dynamic";

const SOCIAL_ICONS: Record<string, ComponentType<{ size?: number | string }>> = {
    github: Github,
    mail: Mail,
    email: Mail,
    globe: Globe,
    website: Globe,
    twitter: Twitter,
    x: Twitter,
    linkedin: Linkedin,
};

export default async function AboutPage() {
    const profile = await getSiteProfile().catch(() => null);

    const name = profile?.name || profileConfig.name;
    const titleText = profile?.title || profileConfig.title;
    const bio = profile?.bio || profileConfig.bio;
    const intro = profile?.intro || "";
    const avatar = profile?.avatar || profileConfig.avatar;
    const socials =
        profile?.socials && profile.socials.length > 0
            ? profile.socials
            : profileConfig.socials.map((s) => ({ label: s.label, href: s.href, iconKey: s.label.toLowerCase() }));

    return (
        <div className="mx-auto max-w-2xl">
            <header className="mb-10 flex flex-col items-center text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} alt={name} className="h-24 w-24 rounded-3xl border border-border object-cover shadow-sm" />
                <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">{name}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{titleText}</p>
            </header>

            <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
                {intro ? (
                    <p className="whitespace-pre-line">{intro}</p>
                ) : (
                    <>
                        <p>
                            你好，我是 {name}。{bio}
                        </p>
                        <p>
                            我专注于 TypeScript 全栈开发与 AI 自动化，喜欢把复杂的问题拆开、理清、再用代码把它解决掉。
                            这个站点是我的数字花园：左边是项目作品，中间是技术文章、速查表与学习笔记，都是我一路走来的沉淀。
                        </p>
                        <p>如果你对我的项目感兴趣，或者想聊聊技术，欢迎通过下面的方式找到我。</p>
                    </>
                )}
            </div>

            {socials.length > 0 && (
                <div className="mt-10 flex flex-wrap gap-3">
                    {socials.map((s) => {
                        const Icon = SOCIAL_ICONS[s.iconKey?.toLowerCase()] ?? LinkIcon;
                        return (
                            <a
                                key={s.label}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/30 hover:bg-accent"
                            >
                                <Icon size={16} />
                                {s.label}
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
