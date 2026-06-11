import "dotenv/config";
import { db } from "../src/db";
import { articles, user } from "../src/db/schema";
import { eq } from "drizzle-orm";

/**
 * 本地测试数据：植入一批已发布文章。
 *
 * 设计意图（为方便测试三个新功能）：
 * 1. 标签刻意互相重叠/分群 —— 让「相关推荐」的 Jaccard 相似度排序有明显差异可看。
 * 2. 内容是真 Markdown（标题/列表/代码块/表格）—— 验证 AI 流式输出 + ChatMarkdown 渲染。
 * 3. 全部填 publishedAt（=已发布），挑一篇置顶，覆盖公开页可见性逻辑。
 *
 * 安全：仅写本地 127.0.0.1 库；按 slug 去重，可重复运行不会插重复。
 */

type SeedArticle = {
    slug: string;
    title: string;
    summary: string;
    tags: string[];
    pinned?: boolean;
    content: string;
};

const SEED: SeedArticle[] = [
    {
        slug: "react-server-components-intro",
        title: "搞懂 React Server Components：它到底解决了什么",
        summary: "RSC 不是给组件加 buff，而是把渲染时机和数据获取重新洗牌。本文从“为什么”讲起。",
        tags: ["前端", "React", "Next.js"],
        pinned: true,
        content: `# 搞懂 React Server Components

很多人第一次接触 RSC 会困惑：组件不就是组件吗，加个 Server 前缀有什么区别？

## 核心区别

普通客户端组件的代码会被打包进 JS 发到浏览器；而服务端组件**只在服务器上执行一次**，浏览器收到的是渲染好的结果，不含组件代码本身。

- 服务端组件：可以直接 \`await\` 数据库、读文件，**零 JS 体积**
- 客户端组件：负责交互（onClick、useState），打包进 bundle

## 一个判断口诀

| 需求 | 用哪种 |
| --- | --- |
| 纯展示、要 SEO | 服务端组件 |
| 有点击/输入/状态 | 客户端组件 |

\`\`\`tsx
// 服务端组件可以直接拿数据，不用 useEffect
async function ArticleList() {
  const items = await db.select().from(articles);
  return <ul>{items.map(a => <li key={a.id}>{a.title}</li>)}</ul>;
}
\`\`\`

记住一句话：**默认服务端，需要交互时才下沉到客户端。**`,
    },
    {
        slug: "nextjs-app-router-data-fetching",
        title: "Next.js App Router 数据获取的三种姿势",
        summary: "fetch 缓存、服务端组件直连、Server Actions —— 什么时候用哪个？",
        tags: ["前端", "Next.js", "全栈"],
        content: `# App Router 的数据获取

App Router 把数据获取彻底重做了一遍，主要有三条路。

## 1. 服务端组件直接取

最常用，直接在组件里 await，天然不暴露给客户端。

## 2. fetch 自带缓存

Next 扩展了原生 \`fetch\`，加了缓存语义：

\`\`\`ts
// 默认会缓存；要实时数据加 no-store
const res = await fetch(url, { cache: "no-store" });
\`\`\`

## 3. Server Actions 处理写操作

表单提交、改数据走 Server Action，不用手写 API 路由。

- 读：服务端组件 / fetch
- 写：Server Action
- 实时性要求高：no-store 或重新验证`,
    },
    {
        slug: "drizzle-orm-type-safety",
        title: "Drizzle ORM 的全链路类型安全是怎么做到的",
        summary: "从 schema 到查询结果，类型一路推导不断链。$inferSelect 是关键。",
        tags: ["后端", "TypeScript", "全栈", "数据库"],
        content: `# Drizzle 的类型安全

Drizzle 最爽的一点：你定义一次表结构，查询结果的类型**自动推导**出来，改了字段编译器立刻报错。

## $inferSelect

\`\`\`ts
import { articles } from "./schema";

// 直接从表定义推出“一行”的类型，不用手写 interface
type Article = typeof articles.$inferSelect;
\`\`\`

## 为什么重要

- 改了 schema，所有用到的地方编译期就红
- 不会出现“数据库有这列、代码以为没有”的错位
- 配合 Zod 可以从同一份 schema 校验输入

类型安全的本质是**让真相只有一处**：schema 是唯一源头。`,
    },
    {
        slug: "postgres-index-basics",
        title: "Postgres 索引入门：什么时候该加，加了为什么快",
        summary: "B-Tree、复合索引、覆盖索引，用 EXPLAIN 看清查询计划再决定。",
        tags: ["后端", "数据库", "性能优化"],
        content: `# Postgres 索引入门

索引不是“加了就快”，加错了反而拖慢写入。

## B-Tree 是默认主力

绝大多数等值和范围查询，B-Tree 就够用：

\`\`\`sql
CREATE INDEX idx_articles_published ON articles (published_at);
\`\`\`

## 用 EXPLAIN 验证

\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM articles WHERE published_at IS NOT NULL;
\`\`\`

看到 \`Seq Scan\` 说明全表扫，\`Index Scan\` 才是走了索引。

## 经验

- 高频查询条件的列才加
- 写多读少的表别乱加
- 复合索引讲究最左前缀`,
    },
    {
        slug: "redis-cache-invalidation",
        title: "缓存失效：分布式系统里最难的两件事之一",
        summary: "本地 Redis 和服务器 Redis 是两套独立真相源，改了库不会自动清对方缓存。",
        tags: ["后端", "性能优化", "Redis", "架构"],
        content: `# 缓存失效的坑

有句老话：计算机科学只有两件难事，缓存失效和命名。

## 一个真实的坑

本地开发的 Redis（127.0.0.1）和服务器的 Redis 是**两套完全独立**的实例。你直接改了数据库，缓存不会自己知道：

- 改了 DB 的文章 → 缓存里还是旧的
- 必须显式 \`del\` 掉对应 key

\`\`\`ts
await redis.del(\`articles:list\`);
\`\`\`

## 常见策略

- 写后删除（write-through 的简化版）
- 设过期时间兜底（哪怕忘了删，30 分钟后也会自动失效）
- 关键数据用版本号 key

记住：**缓存和数据库是两个真相源，同步是你的责任。**`,
    },
    {
        slug: "langgraph-reflection-agent",
        title: "用 LangGraph 搭一个会自我反思的 AI Agent",
        summary: "生成 → 自我审查 → 不合格打回重写，反思工作流如何降低幻觉。",
        tags: ["AI", "LangGraph", "架构", "后端"],
        content: `# 会自我反思的 Agent

普通调 LLM 是“问一句答一句”，反思工作流多了一道质量门。

## 三个节点

\`\`\`
generate → (要调工具?) → tools → generate
         → (不调) → reflect → (PERFECT?) → 结束
                            → (有问题) → 打回 generate 重写
\`\`\`

## 为什么能降幻觉

- **生成节点**：先冲一版答案，可调用工具拿真实数据（grounding）
- **审查节点**：换一个“严格挑刺”的视角自查，容易抓出第一遍的逻辑漏洞
- 不通过就带着反馈重写，直到判定合格

## 局限（要诚实）

- 审查靠关键字 PERFECT 判定，脆弱，更稳应该用结构化输出返回布尔
- 多轮重写会翻倍 token、增加延迟
- 要设最大重写次数兜底，否则可能反复打回`,
    },
    {
        slug: "rag-reduce-hallucination",
        title: "RAG 入门：让 AI 别再一本正经地胡说八道",
        summary: "检索增强生成的核心是“先查资料再回答”，把答案 grounding 在真实数据上。",
        tags: ["AI", "RAG", "架构"],
        content: `# RAG 入门

大模型的记忆会过期、会编造。RAG 的思路很朴素：**回答前先去知识库查资料**。

## 流程

1. 把问题拿去检索（关键词或向量）
2. 取回最相关的几段真实资料
3. 把资料塞进 prompt，让模型照着答

\`\`\`ts
const docs = await search(question);   // 检索
const prompt = \`根据以下资料回答：\\n\${docs}\\n问题：\${question}\`;
const answer = await llm.invoke(prompt);
\`\`\`

## 关键词 vs 向量

- 关键词匹配：简单、快，但答不了“语义相近换了说法”
- 向量检索：能理解语义，但要额外的向量库

## 和反思工作流配合

RAG 解决“有没有根据”，反思解决“答得对不对”，两者叠加防幻觉效果最好。`,
    },
];

async function main() {
    console.log("=== 开始植入测试文章（本地库）===");

    // 复用库里已有的任意用户作为作者，避免硬编码 ID
    const [author] = await db.select().from(user).limit(1);
    if (!author) {
        console.error("❌ 库里没有任何用户，请先跑 seed-user 创建账号再来。");
        process.exit(1);
    }
    console.log(`作者: ${author.email || author.username}`);

    let created = 0;
    let skipped = 0;
    // 用递减的发布时间，保证倒序展示时顺序稳定（越靠前的越新）
    const now = Date.now();

    for (let i = 0; i < SEED.length; i++) {
        const a = SEED[i];
        const [existing] = await db.select().from(articles).where(eq(articles.slug, a.slug));
        if (existing) {
            console.log(`跳过（已存在）: ${a.slug}`);
            skipped++;
            continue;
        }
        const publishedAt = new Date(now - i * 3600_000); // 每篇间隔 1 小时
        await db.insert(articles).values({
            slug: a.slug,
            title: a.title,
            content: a.content,
            summary: a.summary,
            tags: a.tags,
            isPinned: a.pinned ?? false,
            publishedAt,
            createdAt: publishedAt,
            updatedAt: publishedAt,
            userId: author.id,
        });
        console.log(`创建: ${a.title}`);
        created++;
    }

    console.log(`=== 完成：新增 ${created} 篇，跳过 ${skipped} 篇 ===`);
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
