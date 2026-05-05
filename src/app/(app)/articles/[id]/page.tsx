import { ArticleEditorWrapper } from "./ArticleEditorWrapper";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ArticleEditorWrapper id={id} />;
}
