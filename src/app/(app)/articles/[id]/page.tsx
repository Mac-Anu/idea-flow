import { notFound } from "next/navigation";
import { articlesApi } from "@/api/articles";
import { ArticleEditor } from "./ArticleEditor";
import { headers } from "next/headers";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const headersList = await headers();

    // 通过 API 层拉取数据，并透传 cookie 以通过鉴权
    const res = await articlesApi.detail(id, {
        headers: { cookie: headersList.get("cookie") || "" },
    });

    if (!res.ok) {
        notFound();
    }

    // 完美类型收窄
    const { article } = await res.json();

    return <ArticleEditor article={article} />;
}
