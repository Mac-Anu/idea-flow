/**
 * 检索精排（rerank）：向量召回 top-N 后，用 DashScope qwen3-rerank 对 query 与
 * 候选文本做二次相关性打分排序，取最相关的 top-K。先粗召回（向量，快）再精排
 * （rerank，准）是工业级 RAG 标配。
 *
 * 降级策略：rerank 调用失败（网络/鉴权/超时）时不抛错，直接返回向量召回的前 K 个，
 * 保证问答链路不被一个外部依赖拖垮。
 */

const RERANK_ENDPOINT = "https://dashscope.aliyuncs.com/compatible-api/v1/reranks";
const RERANK_MODEL = "qwen3-rerank";

interface RerankResult {
    index: number;
    relevance_score: number;
}

/**
 * 对候选项按与 query 的相关性精排，返回重排后的前 topK 个原始项。
 *
 * @param query - 用户查询
 * @param items - 候选项（任意类型）
 * @param getText - 从候选项取出用于打分的文本
 * @param topK - 返回条数上限
 */
export async function rerankByRelevance<T>(
    query: string,
    items: T[],
    getText: (item: T) => string,
    topK: number,
): Promise<T[]> {
    // 候选不足或无 key 时，直接按原顺序截断（降级）
    if (items.length <= 1 || !process.env.DASHSCOPE_API_KEY) {
        return items.slice(0, topK);
    }

    try {
        const documents = items.map(getText);
        const resp = await fetch(RERANK_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
            },
            body: JSON.stringify({
                model: RERANK_MODEL,
                query,
                documents,
                top_n: topK,
            }),
        });

        if (!resp.ok) {
            throw new Error(`rerank HTTP ${resp.status}`);
        }

        const data = (await resp.json()) as { results?: RerankResult[] };
        const results = data.results;
        if (!Array.isArray(results) || results.length === 0) {
            throw new Error("rerank 返回结果为空");
        }

        // results 已按相关性降序；用 index 映射回原始候选项
        return results
            .filter((r) => r.index >= 0 && r.index < items.length)
            .map((r) => items[r.index])
            .slice(0, topK);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[rerank] 精排失败，降级为向量召回顺序: ${msg}`);
        return items.slice(0, topK);
    }
}
