import "dotenv/config";
import { db } from "../src/db";
import { articles } from "../src/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { embedText, buildArticleEmbeddingText } from "../src/server/agent/embedding";

/**
 * 一次性回填脚本：给尚无向量的文章生成 embedding。
 *
 * 背景：embedding 列是后加的，存量文章该列全为 NULL，向量检索搜不到它们。
 * 本脚本把每篇文章的「标题 + 摘要 + 标签 + 正文前 1000 字」(方案 C) 送进
 * 通义 text-embedding-v4，得到 1024 维向量写回 embedding 列。
 *
 * 安全：只处理 embedding IS NULL 的文章，可重复运行（已回填的会跳过）；
 * 逐篇容错，单篇失败不中断整批。
 */

async function main() {
    console.log("=== 开始回填文章向量 ===");

    // 只取未删除、且 embedding still NULL 的文章
    const pending = await db
        .select()
        .from(articles)
        .where(and(isNull(articles.deleteAt), isNull(articles.embedding)));

    if (pending.length === 0) {
        console.log("没有需要回填的文章（全部已有向量）。");
        process.exit(0);
    }

    console.log(`待回填 ${pending.length} 篇。`);

    let done = 0;
    let failed = 0;

    for (const a of pending) {
        try {
            const text = buildArticleEmbeddingText(a);
            const vector = await embedText(text); // 1024 维 number[]
            await db
                .update(articles)
                .set({ embedding: vector })
                .where(eq(articles.id, a.id));
            done++;
            console.log(`✅ [${done}/${pending.length}] ${a.title}`);
        } catch (e) {
            failed++;
            const msg = e instanceof Error ? e.message : String(e);
            console.warn(`❌ 失败: ${a.title} — ${msg}`);
        }
    }

    console.log(`=== 完成：成功 ${done} 篇，失败 ${failed} 篇 ===`);
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
