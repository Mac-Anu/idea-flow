import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/hono";
import { useArticleStore } from "./store";
import { Editor } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { Article } from "@/server/articles/type";

export const useArticleEditor = (article: Article) => {
    const router = useRouter();
    const [title, setTitle] = useState(article.title === "新页面" ? "" : article.title);
    const [content, setContent] = useState(article.content);
    const [tags, setTags] = useState<string[]>(article.tags || []);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [headings, setHeadings] = useState<{ level: number; text: string; pos: number }[]>([]);
    const titleRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const { setActiveArticle, updateActiveArticleTitle } = useArticleStore();
    const [editor, setEditor] = useState<Editor | null>(null);

    // 新文章自动聚焦标题
    useEffect(() => {
        if (!article.title || article.title === "新页面") {
            titleRef.current?.focus();
        }
    }, [article.title]);

    // 同步到全局状态
    useEffect(() => {
        setActiveArticle(article.id, article.title === "新页面" ? "" : article.title);
    }, [article.id, article.title, setActiveArticle]);

    // 标题按 Enter → 跳到正文
    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            contentRef.current?.focus();
        }
    };

    // 保存
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const res = await client.api.articles[":id"].$put({
                param: {
                    id: article.id,
                },
                json: {
                    id: article.id,
                    title: title.trim(),
                    content: content,
                    tags: tags,
                },
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                router.refresh();
            }
        } catch (error) {
            console.error("保存失败:", error);
        } finally {
            setIsSaving(false);
        }
    }, [article.id, article.title, article.content, article.tags, title, content, tags, router]);

    // 防抖自动更新
    const debouncedAutoSave = useDebouncedCallback(() => {
        handleSave();
    }, 1000);

    useEffect(() => {
        // 只有内容真的变了，才触发防抖计时
        if (
            title === (article.title === "新页面" ? "" : article.title) &&
            content === article.content &&
            JSON.stringify(tags) === JSON.stringify(article.tags || [])
        ) {
            return;
        }
        debouncedAutoSave();
    }, [title, content, tags, article, debouncedAutoSave]);

    // Ctrl+S / Cmd+S 保存快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                e.preventDefault();
                debouncedAutoSave.cancel();
                handleSave();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [title, content, tags]);

    // 删除
    const handleDelete = async () => {
        try {
            const res = await client.api.articles[":id"].$delete({
                param: {
                    id: article.id,
                },
            });

            if (res.ok) {
                router.push("/articles");
                router.refresh();
            }
        } catch (error) {
            console.error("删除失败:", error);
        }
    };

    return {
        title,
        content,
        tags,
        isSaving,
        saved,
        headings,
        editor,
        titleRef,
        contentRef,
        setTitle,
        setContent,
        setTags,
        setHeadings,
        setEditor,
        updateActiveArticleTitle,
        handleTitleKeyDown,
        handleSave,
        handleDelete,
    };
};
