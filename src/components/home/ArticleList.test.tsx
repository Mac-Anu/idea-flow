import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleList } from "./ArticleList";
import type { Article } from "@/server/articles/type";

// next/navigation 在测试环境无 router 上下文，mock 掉
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

function makeArticle(over: Partial<Article> = {}): Article {
    return {
        id: "1",
        title: "测试文章标题",
        content: "<p>这是正文内容</p>",
        slug: "test-article",
        tags: ["前端"],
        updatedAt: "2026-05-01T12:00:00Z",
        ...over,
    } as Article;
}

describe("ArticleList", () => {
    it("有文章时渲染标题", () => {
        render(<ArticleList articles={[makeArticle()]} allTags={[{ name: "前端", count: 1 }]} />);
        expect(screen.getByText("测试文章标题")).toBeInTheDocument();
    });

    it("标签下无匹配文章时显示空状态", () => {
        render(
            <ArticleList
                articles={[makeArticle({ tags: ["后端"] })]}
                allTags={[{ name: "后端", count: 1 }]}
                activeTag="不存在的标签"
            />,
        );
        expect(screen.getByText("查看全部文章")).toBeInTheDocument();
        expect(screen.getByText(/还没有文章/)).toBeInTheDocument();
    });

    it("超过单页数量时显示「加载更多」", () => {
        const many = Array.from({ length: 8 }, (_, i) =>
            makeArticle({ id: String(i), title: `文章${i}`, slug: `a-${i}` }),
        );
        render(<ArticleList articles={many} allTags={[]} />);
        expect(screen.getByText(/加载更多/)).toBeInTheDocument();
    });
});
