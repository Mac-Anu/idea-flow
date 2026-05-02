import { create } from "zustand";

interface ArticleStore {
    activeArticleId: string | null;
    activeArticleTitle: string;
    setActiveArticle: (id: string, title: string) => void;
    updateActiveArticleTitle: (title: string) => void;
}

export const useArticleStore = create<ArticleStore>((set) => ({
    activeArticleId: null,
    activeArticleTitle: "",
    setActiveArticle: (id, title) => set({ activeArticleId: id, activeArticleTitle: title }),
    updateActiveArticleTitle: (title) => set({ activeArticleTitle: title }),
}));
