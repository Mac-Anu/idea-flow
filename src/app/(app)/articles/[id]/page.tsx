import { ArticleEditorWrapper } from "./ArticleEditorWrapper";

export default async function ArticlePage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ id: string }>;
    searchParams: Promise<{ highlight?: string }>;
}) {
    const { id } = await params;
    const { highlight } = await searchParams;
    return <ArticleEditorWrapper id={id} highlight={highlight} />;
}
