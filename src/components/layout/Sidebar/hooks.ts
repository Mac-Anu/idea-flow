import { useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useArticleStore } from "@/components/article/store";
import { client } from "@/lib/hono";
import type { Article } from "@/server/articles/type";

export const useSidebar = (articles: Article[]) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isAllModalOpen, setIsAllModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);
    const activeArticleId = useArticleStore((state) => state.activeArticleId);
    const activeArticleTitle = useArticleStore((state) => state.activeArticleTitle);

    const DISPLAY_LIMIT = 10;
    const displayedArticles = articles.slice(0, DISPLAY_LIMIT);
    const hasMore = articles.length > DISPLAY_LIMIT;

    const handleNewArticle = async () => {
        if (isCreating) return;
        setIsCreating(true);

        // 在非 HTTPS 环境下（如直接用 IP 访问），crypto.randomUUID() 不可用，需要自己写一个降级方案
        const generateUUID = () => {
            if (typeof crypto !== "undefined" && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = (Math.random() * 16) | 0,
                    v = c == "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        };

        const newId = generateUUID();
        router.push(`/articles/${newId}`);

        // 2. 后台静默创建，完成后刷新侧边栏文章列表
        try {
            await client.api.articles.$post({
                json: { id: newId, title: "", content: "" },
            });
            router.refresh();
        } catch (error) {
            console.log("新建文章失败", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteArticle = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await client.api.articles[":id"].$delete({
                param: { id },
            });
            if (res.ok) {
                if (pathname === `/articles/${id}`) {
                    router.push("/articles");
                }
                router.refresh();
            }
        } catch (error) {
            console.error("删除失败:", error);
        }
    };

    return {
        pathname,
        isAllModalOpen,
        setIsAllModalOpen,
        isSearchOpen,
        setIsSearchOpen,
        isTrashOpen,
        setIsTrashOpen,
        isCreating,
        sidebarRef,
        activeArticleId,
        activeArticleTitle,
        DISPLAY_LIMIT,
        displayedArticles,
        hasMore,
        handleNewArticle,
        handleDeleteArticle,
    };
};
