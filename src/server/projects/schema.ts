import { z } from "zod";

export const ProjectSchema = z.object({
    id: z.string().min(1, "ID不能为空").meta({ description: "项目的唯一ID" }),
    slug: z.string().nullable().optional().meta({ description: "详情页短链接别名" }),
    title: z.string().meta({ description: "项目标题" }),
    description: z.string().meta({ description: "项目简介" }),
    imageUrl: z.string().nullable().optional().meta({ description: "封面/缩略图 URL" }),
    gallery: z.array(z.string()).nullable().optional().meta({ description: "项目图集 URL 数组" }),
    techStack: z.array(z.string()).nullable().optional().meta({ description: "技术栈名称数组" }),
    liveUrl: z.string().nullable().optional().meta({ description: "线上 Demo 地址" }),
    githubUrl: z.string().nullable().optional().meta({ description: "源码仓库地址" }),
    featured: z.boolean().optional().meta({ description: "是否精选" }),
    sortOrder: z.number().optional().meta({ description: "排序权重(大的靠前)" }),
    isPinned: z.boolean().optional().meta({ description: "是否置顶" }),
    showOnHome: z.boolean().optional().meta({ description: "是否展示在首页项目区" }),
    publishedAt: z.string().nullable().optional().meta({ description: "发布时间，null 表示草稿" }),
    createdAt: z.string().meta({ description: "创建时间" }),
    updatedAt: z.string().meta({ description: "更新时间" }),
    userId: z.string().optional().meta({ description: "所属作者ID" }),
});

export const createProjectSchema = z
    .object({
        id: z.string().uuid().optional().meta({ description: "客户端预生成的 UUID(可选)" }),
        title: z.string().min(1, "标题不能为空").meta({ description: "项目标题" }),
        description: z.string().optional().meta({ description: "项目简介" }),
        imageUrl: z.string().optional().meta({ description: "封面/缩略图 URL" }),
        gallery: z.array(z.string()).optional().meta({ description: "项目图集 URL 数组" }),
        techStack: z.array(z.string()).optional().meta({ description: "技术栈名称数组" }),
        liveUrl: z.string().optional().meta({ description: "线上 Demo 地址" }),
        githubUrl: z.string().optional().meta({ description: "源码仓库地址" }),
        featured: z.boolean().optional().meta({ description: "是否精选" }),
        sortOrder: z.number().optional().meta({ description: "排序权重" }),
        isPinned: z.boolean().optional().meta({ description: "是否置顶" }),
        showOnHome: z.boolean().optional().meta({ description: "是否展示在首页项目区" }),
        published: z.boolean().optional().meta({ description: "是否发布(true 设发布时间,false 转草稿)" }),
        slug: z.string().optional().meta({ description: "短链接别名" }),
    })
    .meta({ description: "新建项目的请求参数格式" });

export const updateProjectSchema = z
    .object({
        title: z.string().min(1, "标题不能为空").meta({ description: "项目标题" }),
        description: z.string().optional().meta({ description: "项目简介" }),
        imageUrl: z.string().nullable().optional().meta({ description: "封面/缩略图 URL" }),
        gallery: z.array(z.string()).optional().meta({ description: "项目图集 URL 数组" }),
        techStack: z.array(z.string()).optional().meta({ description: "技术栈名称数组" }),
        liveUrl: z.string().nullable().optional().meta({ description: "线上 Demo 地址" }),
        githubUrl: z.string().nullable().optional().meta({ description: "源码仓库地址" }),
        featured: z.boolean().optional().meta({ description: "是否精选" }),
        sortOrder: z.number().optional().meta({ description: "排序权重" }),
        isPinned: z.boolean().optional().meta({ description: "是否置顶" }),
        showOnHome: z.boolean().optional().meta({ description: "是否展示在首页项目区" }),
        published: z.boolean().optional().meta({ description: "是否发布(true 设发布时间,false 转草稿)" }),
        slug: z.string().optional().meta({ description: "短链接别名" }),
    })
    .meta({ description: "修改项目的请求参数格式" });
