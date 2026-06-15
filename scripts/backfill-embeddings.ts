import "dotenv/config";
import { db } from "../src/db";
import { articles, articleChunks } from "../src/db/schema";
import { eq, isNull } from "drizzle-orm";
import { embedText, chunkArticle } from "../src/server/agent/embedding";

/**
 * 一次性回填脚本：给文章生成分块向量（article_chunks）。
 *
 * 背景：检索已从「整篇一个向量」升级为「文章分块、每块一个向量」。本脚本把每篇文章
 * 用 chunkArticle 切块，逐块过通义 text-embedding-v4 得到 1024 维向量，写入 article_chunks。
 *
 * 安全：默认只处理「尚无任何 chunk」的文章，可重复运行；逐篇容错，单篇失败不中断整批。
 * 加 --force 参数则对所有文章重算（先删旧块再生成），用于分块策略调整后全量重建。
 */

async function main() {
    const force = process.argv.includes("--force");
    console.log(`=== 开始回填文章分块向量${force ? "（--force 全量重建）" : ""} ===`);

    // 取未删除的文章；非 force 模式下跳过已经有 chunk 的
    const all = await db
        .select()
        .from(articles)
        .where(isNull(articles.deleteAt));

    // 已有 chunk 的文章 id 集合（非 force 时用于跳过）
    let skip = new Set<string>();
    if (!force) {
        const existing = await db
            .selectDistinct({ articleId: articleChunks.articleId })
            .from(articleChunks);
        skip = new Set(existing.map((e) => e.articleId));
    }

    const pending = all.filter((a) => a.content && (force || !skip.has(a.id)));

    if (pending.length === 0) {
        console.log("没有需要回填的文章（全部已有分块向量）。");
        process.exit(0);
    }

    console.log(`待回填 ${pending.length} 篇。`);

    let done = 0;
    let failed = 0;
    let totalChunks = 0;

    for (const a of pending) {
        try {
            const chunks = chunkArticle(a);
            if (chunks.length === 0) {
                console.log(`⏭️  跳过（无内容）: ${a.title}`);
                continue;
            }

            // 幂等：先删旧块再写新块
            await db.delete(articleChunks).where(eq(articleChunks.articleId, a.id));

            const rows = [];
            for (let i = 0; i < chunks.length; i++) {
                const vector = await embedText(chunks[i]); // 1024 维 number[]
                rows.push({
                    articleId: a.id,
                    chunkIndex: i,
                    content: chunks[i],
                    embedding: vector,
                });
            }
            await db.insert(articleChunks).values(rows);

            done++;
            totalChunks += chunks.length;
            console.log(`✅ [${done}/${pending.length}] ${a.title} — ${chunks.length} 块`);
        } catch (e) {
            failed++;
            const msg = e instanceof Error ? e.message : String(e);
            console.warn(`❌ 失败: ${a.title} — ${msg}`);
        }
    }

    console.log(`=== 完成：成功 ${done} 篇（共 ${totalChunks} 块），失败 ${failed} 篇 ===`);
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
