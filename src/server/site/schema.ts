import { z } from "zod";

export const socialLinkSchema = z.object({
    label: z.string().meta({ description: "社媒名称，如 GitHub" }),
    href: z.string().meta({ description: "链接地址" }),
    iconKey: z.string().meta({ description: "图标键，对应前端图标映射，如 github/mail/globe" }),
});

export const SiteProfileSchema = z.object({
    id: z.string().optional().meta({ description: "记录ID" }),
    headline: z.string().meta({ description: "版头大标题" }),
    intro: z.string().meta({ description: "版头自我介绍段落" }),
    bannerImage: z.string().nullable().optional().meta({ description: "版头背景图" }),
    avatar: z.string().nullable().optional().meta({ description: "站长头像" }),
    name: z.string().meta({ description: "展示名" }),
    title: z.string().meta({ description: "一句话头衔" }),
    bio: z.string().meta({ description: "侧边栏简短 bio" }),
    socials: z.array(socialLinkSchema).nullable().optional().meta({ description: "社媒链接数组" }),
    updatedAt: z.string().optional().meta({ description: "更新时间" }),
    userId: z.string().optional().meta({ description: "站长用户ID" }),
});

export const updateSiteProfileSchema = z
    .object({
        headline: z.string().optional(),
        intro: z.string().optional(),
        bannerImage: z.string().nullable().optional(),
        avatar: z.string().nullable().optional(),
        name: z.string().optional(),
        title: z.string().optional(),
        bio: z.string().optional(),
        socials: z.array(socialLinkSchema).optional(),
    })
    .meta({ description: "更新站点 Profile 的请求参数" });
