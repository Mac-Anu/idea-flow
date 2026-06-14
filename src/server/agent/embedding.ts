import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-v4",
    apiKey: process.env.DASHSCOPE_API_KEY, // 阿里云那串 sk-xxx
    configuration: {
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
});

export async function embedText(text: string): Promise<number[]> {
    return embeddings.embedQuery(text);
}

/**
 * 拼接用于 embedding 的文本（方案 C）：主旨(标题/摘要/标签) + 正文细节(截断 1000 字)。
 *
 * 不用全文：长文会稀释主旨让向量变模糊，且费 token。取标题+摘要+标签+正文前 1000 字，
 * 让向量聚焦文章核心语义，兼顾召回与成本。回填脚本与发布时的增量生成共用此函数。
 */
export function buildArticleEmbeddingText(a: {
    title: string;
    summary: string | null;
    tags: string[] | null;
    content: string;
}): string {
    const parts = [
        a.title,
        a.summary ?? "",
        (a.tags ?? []).join(" "),
        a.content.slice(0, 1000),
    ];
    return parts.filter(Boolean).join("\n");
}

