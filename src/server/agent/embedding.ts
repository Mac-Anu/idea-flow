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

/**
 * 递归字符分割：按分隔符优先级（段落 → 行 → 句 → 空格）把长文本切成 ~chunkSize 大小的块，
 * 相邻块重叠 overlap 字符，防止一句话被切在边界两半都丢语义。对标 LangChain 的
 * RecursiveCharacterTextSplitter（项目未装该依赖，这里轻量自实现）。
 */
function splitRecursively(
    text: string,
    chunkSize: number,
    overlap: number,
): string[] {
    const separators = ["\n\n", "\n", "。", "！", "？", ". ", " "];

    // 把文本按「能让每段都不超过 chunkSize」的最高优先级分隔符拆开
    const splitByBest = (s: string): string[] => {
        if (s.length <= chunkSize) return [s];
        for (const sep of separators) {
            if (!s.includes(sep)) continue;
            const parts = s.split(sep);
            // 保留分隔符（除空格外），避免拼回去时丢标点
            const keep = sep === " " ? "" : sep;
            return parts.map((p, i) => (i < parts.length - 1 ? p + keep : p));
        }
        // 没有任何分隔符可用：按定长硬切
        const hard: string[] = [];
        for (let i = 0; i < s.length; i += chunkSize) hard.push(s.slice(i, i + chunkSize));
        return hard;
    };

    // 贪心合并小片段到接近 chunkSize，超长的递归再切
    const merge = (pieces: string[]): string[] => {
        const out: string[] = [];
        let buf = "";
        for (const p of pieces) {
            if (p.length > chunkSize) {
                if (buf) { out.push(buf); buf = ""; }
                out.push(...merge(splitByBest(p)));
                continue;
            }
            if ((buf + p).length > chunkSize) {
                if (buf) out.push(buf);
                buf = p;
            } else {
                buf += p;
            }
        }
        if (buf) out.push(buf);
        return out;
    };

    const merged = merge(splitByBest(text)).map((c) => c.trim()).filter(Boolean);
    if (overlap <= 0 || merged.length <= 1) return merged;

    // 给每块前面补上一块尾部 overlap 个字符，制造重叠
    return merged.map((c, i) => {
        if (i === 0) return c;
        const prevTail = merged[i - 1].slice(-overlap);
        return prevTail + c;
    });
}

/**
 * 把一篇文章切成用于分块 RAG 的文本块。
 *
 * 第 0 块前置「标题 + 标签」作为上下文锚点（保留旧方案的主旨思想），其余块为正文递归切分。
 * 每块约 500 字符、相邻重叠 80 字符。返回的每个字符串将各自向量化、独立入库检索。
 */
export function chunkArticle(a: {
    title: string;
    summary: string | null;
    tags: string[] | null;
    content: string;
}): string[] {
    const CHUNK_SIZE = 500;
    const CHUNK_OVERLAP = 80;

    const header = [a.title, (a.tags ?? []).join(" "), a.summary ?? ""]
        .filter(Boolean)
        .join(" | ");

    const bodyChunks = splitRecursively(a.content ?? "", CHUNK_SIZE, CHUNK_OVERLAP);

    if (bodyChunks.length === 0) {
        return header ? [header] : [];
    }

    // 标题/标签/摘要拼到第 0 块前面，让首块带上文章主旨
    bodyChunks[0] = header ? `${header}\n${bodyChunks[0]}` : bodyChunks[0];
    return bodyChunks;
}

