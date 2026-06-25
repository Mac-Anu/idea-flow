import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/hono";
import { useArticleStore } from "./store";
import { Editor } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { Article } from "@/server/articles/type";

// 本地草稿的 key：按文章 id 隔离，避免多篇文章草稿串味
const draftKey = (id: string) => `article-draft-${id}`;

export const useArticleEditor = (article: Article) => {
    const router = useRouter();
    const [title, setTitle] = useState(article.title === "新页面" ? "" : article.title);
    const [content, setContent] = useState(article.content);
    const [tags, setTags] = useState<string[]>(article.tags || []);
    const [imageUrl, setImageUrl] = useState<string>(article.imageUrl || "");
    // 保存状态：用一个变量表达四种情况，比两个布尔清楚
    // idle=没动作 saving=保存中 saved=已保存 error=保存失败
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [isPublished, setIsPublished] = useState(!!article.publishedAt);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPinned, setIsPinned] = useState(!!article.isPinned);
    const [isPinning, setIsPinning] = useState(false);
    const [showOnHome, setShowOnHome] = useState(!!article.showOnHome);
    const [isTogglingHome, setIsTogglingHome] = useState(false);
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
        setSaveStatus("saving");
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
                    imageUrl: imageUrl || null,
                },
            });

            if (res.ok) {
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
                // 已经存进数据库了，本地草稿就没用了，清掉
                localStorage.removeItem(draftKey(article.id));
                router.refresh();
            } else {
                // 请求发出去了，但后端返回非 2xx（比如 500）：也算失败
                setSaveStatus("error");
            }
        } catch (error) {
            // 断网 / 请求根本没发出去：在界面上告诉用户，别只闷在控制台
            console.error("保存失败:", error);
            setSaveStatus("error");
        }
    }, [article.id, title, content, tags, imageUrl, router]);

    // 防抖自动更新
    const debouncedAutoSave = useDebouncedCallback(() => {
        handleSave();
    }, 1000);

    useEffect(() => {
        // 只有内容真的变了，才触发防抖计时
        if (
            title === (article.title === "新页面" ? "" : article.title) &&
            content === article.content &&
            imageUrl === (article.imageUrl || "") &&
            JSON.stringify(tags) === JSON.stringify(article.tags || [])
        ) {
            return;
        }
        debouncedAutoSave();
    }, [title, content, tags, imageUrl, article, debouncedAutoSave]);

    // 【第三层 localStorage 兜底】内容一变就写一份到浏览器本地。
    // 这样哪怕保存失败、用户关了页面（内存清空），下次打开还能从这里捞回来——
    // 这才是“连关页面都不丢”的底，光靠内存里的文字是会随页面关闭一起没的。
    useEffect(() => {
        // 和数据库一致就不必留草稿，避免误弹“恢复”
        if (
            title === (article.title === "新页面" ? "" : article.title) &&
            content === article.content &&
            JSON.stringify(tags) === JSON.stringify(article.tags || [])
        ) {
            return;
        }
        localStorage.setItem(draftKey(article.id), JSON.stringify({ title, content, tags }));
    }, [title, content, tags, article]);

    // 【打开文章时检查本地草稿】如果上次有没存成功的内容，问用户要不要恢复
    useEffect(() => {
        const raw = localStorage.getItem(draftKey(article.id));
        if (!raw) return;
        try {
            const draft = JSON.parse(raw);
            // 草稿和数据库一样就别打扰用户
            if (draft.content === article.content) {
                localStorage.removeItem(draftKey(article.id));
                return;
            }
            if (window.confirm("检测到上次未保存的内容，是否恢复？")) {
                setTitle(draft.title ?? "");
                setContent(draft.content ?? "");
                setTags(draft.tags ?? []);
            } else {
                localStorage.removeItem(draftKey(article.id));
            }
        } catch {
            localStorage.removeItem(draftKey(article.id));
        }
        // 只在文章首次加载时跑一次，故只依赖 article.id
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [article.id]);

    // 【第二层 自动重试】保存失败后，过几秒自动再试一次。
    // 断网常是闪断，下次重试往往就成功了；成功后 saveStatus 变 saved，定时器自然不再触发。
    useEffect(() => {
        if (saveStatus !== "error") return;
        const timer = setTimeout(() => handleSave(), 5000);
        return () => clearTimeout(timer);
    }, [saveStatus, handleSave]);

    // 【一连上网就重试】比干等 5 秒更灵敏：浏览器恢复网络时立刻补存
    useEffect(() => {
        const onOnline = () => {
            if (saveStatus === "error") handleSave();
        };
        window.addEventListener("online", onOnline);
        return () => window.removeEventListener("online", onOnline);
    }, [saveStatus, handleSave]);

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
    }, [title, content, tags, debouncedAutoSave, handleSave]);

    // 监听 AI 的 Function Calling (事件驱动)
    useEffect(() => {
        const handleAIEdit = async (e: Event) => {
            const customEvent = e as CustomEvent<{ content?: string, title?: string, tags?: string[] }>;
            const { content: newContent, title: newTitle, tags: newTags } = customEvent.detail || {};
            
            // 1. 更新标题
            if (newTitle) {
                setTitle(newTitle);
            }
            // 2. 更新标签
            if (newTags) {
                setTags(newTags);
            }
            // 3. 更新正文
            if (newContent) {
                setContent(newContent); // 保存原始 markdown
                if (editor) {
                    const { marked } = await import('marked');
                    const html = await marked.parse(newContent);
                    editor.commands.setContent(html);
                }
            }
        };

        window.addEventListener('ai-edit-article', handleAIEdit);
        return () => window.removeEventListener('ai-edit-article', handleAIEdit);
    }, [editor]);

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

    // 发布
    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const res = await client.api.articles[":id"].publish.$patch({
                param: { id: article.id },
                json: { published: true },
            });
            if (res.ok) {
                setIsPublished(true);
                router.refresh();
            }
        } catch (error) {
            console.error("发布失败:", error);
        } finally {
            setIsPublishing(false);
        }
    };

    // 取消发布
    const handleUnpublish = async () => {
        setIsPublishing(true);
        try {
            const res = await client.api.articles[":id"].publish.$patch({
                param: { id: article.id },
                json: { published: false },
            });
            if (res.ok) {
                setIsPublished(false);
                setIsPinned(false); // 取消发布会一并取消置顶
                setShowOnHome(false); // 取消发布会一并移出首页
                router.refresh();
            }
        } catch (error) {
            console.error("取消发布失败:", error);
        } finally {
            setIsPublishing(false);
        }
    };

    // 置顶 / 取消置顶
    const handleTogglePin = async () => {
        const next = !isPinned;
        setIsPinning(true);
        try {
            const res = await client.api.articles[":id"].pin.$patch({
                param: { id: article.id },
                json: { pinned: next },
            });
            if (res.ok) {
                setIsPinned(next);
                router.refresh();
            }
        } catch (error) {
            console.error("置顶操作失败:", error);
        } finally {
            setIsPinning(false);
        }
    };

    // 首页展示 / 取消首页展示
    const handleToggleHomeVisibility = async () => {
        const next = !showOnHome;
        setIsTogglingHome(true);
        try {
            const res = await client.api.articles[":id"].home.$patch({
                param: { id: article.id },
                json: { showOnHome: next },
            });
            if (res.ok) {
                setShowOnHome(next);
                router.refresh();
            }
        } catch (error) {
            console.error("首页展示操作失败:", error);
        } finally {
            setIsTogglingHome(false);
        }
    };

    return {
        title,
        content,
        tags,
        imageUrl,
        saveStatus,
        isPublished,
        isPublishing,
        isPinned,
        isPinning,
        showOnHome,
        isTogglingHome,
        headings,
        editor,
        titleRef,
        contentRef,
        setTitle,
        setContent,
        setTags,
        setImageUrl,
        setHeadings,
        setEditor,
        updateActiveArticleTitle,
        handleTitleKeyDown,
        handleSave,
        handleDelete,
        handlePublish,
        handleUnpublish,
        handleTogglePin,
        handleToggleHomeVisibility,
    };
};
