"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * 聊天气泡内的 Markdown 渲染器。
 * 针对小尺寸对话场景调过排版：紧凑的标题、列表、引用块和代码样式。
 */
export const ChatMarkdown = ({ content }: { content: string }) => {
    return (
        <div
            className={cn(
                "text-[15px] leading-relaxed break-words",
                // 段落
                "[&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0",
                // 标题：聊天里弱化层级，统一偏小加粗
                "[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1.5",
                "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5",
                "[&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1",
                "[&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:mt-2.5 [&_h4]:mb-1",
                // 列表
                "[&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1",
                "[&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1",
                "[&_li]:marker:text-primary/60",
                // 引用块：左侧珊瑚色竖线
                "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
                // 行内代码
                "[&_code]:bg-primary/10 [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono",
                // 代码块：去掉行内样式，套上深色背景
                "[&_pre]:bg-foreground/5 [&_pre]:border [&_pre]:border-border [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto",
                "[&_pre_code]:bg-transparent [&_pre_code]:text-foreground [&_pre_code]:p-0 [&_pre_code]:text-[13px]",
                // 链接
                "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80",
                // 强调
                "[&_strong]:font-semibold [&_strong]:text-foreground",
                // 分隔线
                "[&_hr]:my-3 [&_hr]:border-border",
                // 表格
                "[&_table]:my-2 [&_table]:w-full [&_table]:text-[13px] [&_table]:border-collapse",
                "[&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_th]:font-semibold",
                "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1"
            )}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );
};
