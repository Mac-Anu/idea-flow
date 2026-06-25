import { Github, Mail, Globe } from "lucide-react";
import type { ComponentType } from "react";

/**
 * 公开站点的个人资料配置（Profile 侧边栏展示用）。
 * 改这里即可更新头像、简介、社媒链接，无需动组件。
 */
export interface ProfileSocialLink {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string; size?: number | string }>;
}

export const profileConfig = {
    /** 展示名 */
    name: "Mac-Anu",
    /** 一句话头衔 */
    title: "TypeScript 全栈 / AI 自动化",
    /** 头像图片地址（放 public 目录或外链） */
    avatar: "/website-logo-flat.svg",
    /** 简短自我介绍 */
    bio: "记录技术探索、项目复盘与成长思考。",
    /** 社媒/联系方式 */
    socials: [
        { label: "GitHub", href: "https://github.com/Mac-Anu", icon: Github },
        { label: "Email", href: "mailto:hello@example.com", icon: Mail },
        { label: "Website", href: "https://github.com/Mac-Anu", icon: Globe },
    ] as ProfileSocialLink[],
};
