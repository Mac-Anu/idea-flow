import { serverIncs } from '@/server/common/app';
import { queryArticleId } from '../service';
import { db } from '@/db';
import { articles } from '@/db/schema';
import { isNull } from 'drizzle-orm';

export const articleSearchIndex = 'articles';

/**
 * 契约规则 1：我们要喂给 Meilisearch 的文档长什么样？
 * (不把无用的字段喂进去，只喂有利于搜索的字段)
 */
export interface SearchableArticle {
    id: string;
    userId: string; // 必须加入用户ID以实现数据隔离
    title: string;
    content: string;
    slug: string | null;
    tags: string[]; // 扁平化的字符串数组，用于过滤
    createdAt: string;
    updatedAt: string;
}

// 拿到当前引擎实例
export const getArticleSearchIndex = () => {
    return serverIncs.meilisearch['default'].index(articleSearchIndex);
};

let searchInitPromise: Promise<void> | undefined;

/**
 * 契约规则 2：定义字段的职责（这就是教程里的写规则！）
 */
export const rebuildArticleSearchIndex = async () => {
    // 1. 建表，指定主键
    await serverIncs.meilisearch['default']
        .createIndex(articleSearchIndex, { primaryKey: 'id' })
        .waitTask();

    const index = getArticleSearchIndex();

    // 2. 告诉引擎哪些字段怎么用 (并行加速)
    await Promise.all([
        // Searchable：只有这些字段会参与“分词”，当用户在搜索框打字时，只匹配这里
        index.updateSearchableAttributes(['title', 'content', 'tags']).waitTask(),
        
        // Filterable：这些字段用于“左侧边栏点击精确过滤”，以及最重要的“按用户隔离”
        index.updateFilterableAttributes(['tags', 'userId']).waitTask(),
        
        // Sortable：允许按时间倒序排
        index.updateSortableAttributes(['updatedAt', 'createdAt']).waitTask(),
    ]);
};

// 单例保证只在系统启动时执行一次
export const ensureArticleSearchIndex = async () => {
    searchInitPromise ??= (async () => {
        await rebuildArticleSearchIndex();
        // 检查索引是否为空，如果是（比如 MeiliSearch 刚重启），自动全量同步
        const index = getArticleSearchIndex();
        const stats = await index.getStats();
        if (stats.numberOfDocuments === 0) {
            console.log('[MeiliSearch] 检测到空索引，开始全量同步...');
            await fullReindexArticles();
        }
    })();
    return searchInitPromise;
};

/**
 * 全量重建索引：把数据库中所有未删除的文章一次性灌入 MeiliSearch
 * 用于 MeiliSearch 重启后数据恢复、或手动触发重建
 */
export const fullReindexArticles = async () => {
    const allArticles = await db
        .select()
        .from(articles)
        .where(isNull(articles.deleteAt));

    if (allArticles.length === 0) {
        console.log('[MeiliSearch] 数据库中无文章，跳过全量同步');
        return;
    }

    const documents: SearchableArticle[] = allArticles.map((article) => ({
        id: article.id,
        userId: article.userId,
        title: article.title,
        content: article.content,
        slug: article.slug,
        tags: (article.tags as string[]) || [],
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
    }));

    await getArticleSearchIndex().updateDocuments(documents).waitTask();
    console.log(`[MeiliSearch] ✅ 全量同步完成，共索引 ${documents.length} 篇文章`);
};

/**
 * 契约规则 3：全量/增量同步脚本
 * 当文章新增、修改时调用此函数，组装出 SearchableArticle 喂给引擎
 */
export const syncArticleSearchDocument = async (id: string) => {
    const article = await queryArticleId(id);
    
    // 如果文章不存在（已被物理删除），或者被软删除（放入回收站），则从搜索引擎里摘除
    if (!article || article.deleteAt) {
        return deleteArticleSearchDocument(id);
    }

    // 将数据库的复杂对象，转化为我们在上面定义的“苗条版”搜索引擎对象
    const document: SearchableArticle = {
        id: article.id,
        userId: article.userId,
        title: article.title,
        content: article.content,
        slug: article.slug,
        tags: (article.tags as string[]) || [], // 确保是字符串数组
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
    };

    // 覆盖更新/新增文档
    await getArticleSearchIndex().updateDocuments([document]).waitTask();
};

/**
 * 从搜索引擎中彻底删除某篇文章
 */
export const deleteArticleSearchDocument = async (id: string) => {
    await getArticleSearchIndex().deleteDocument(id).waitTask();
};

export interface ArticleSearchResult extends SearchableArticle {
    snippets?: string[];
}

/**
 * 从 HTML 内容中提取包含查询词的多个片段（滑动窗口提取，固定长度，类似 Notion）
 */
function extractMultipleSnippets(htmlContent: string, query: string, maxSnippets: number = 6): string[] {
    // 1. 去除 HTML 标签
    let plainText = htmlContent.replace(/<[^>]+>/g, ' ');
    // 2. 清理多余的空格、换行、特殊不可见字符，把它们变成单个空格
    plainText = plainText.replace(/[\s\n\r\t]+/g, ' ').trim();
    
    const queryLower = query.toLowerCase();
    // 提取搜索词的 tokens
    const queryTokens = queryLower.split(/[\s\p{P}\p{S}]+/u).filter(t => t.length > 0);
    if (queryTokens.length === 0) return [];
    
    // 使用最长的一个 token 作为核心定位点
    const mainToken = queryTokens.sort((a, b) => b.length - a.length)[0];
    
    const snippets: string[] = [];
    const addedSnippetCenters: number[] = [];
    const plainTextLower = plainText.toLowerCase();
    
    let matchIndex = plainTextLower.indexOf(mainToken);
    while (matchIndex !== -1 && snippets.length < maxSnippets) {
        // 防止多个搜索词太近导致重复提取同样的句子
        const isOverlap = addedSnippetCenters.some(center => Math.abs(center - matchIndex) < 40);
        
        if (!isOverlap) {
            // 前后各截取 30 个字符
            const start = Math.max(0, matchIndex - 30);
            const end = Math.min(plainText.length, matchIndex + mainToken.length + 40);
            
            let snippet = plainText.substring(start, end);
            if (start > 0) snippet = "..." + snippet;
            if (end < plainText.length) snippet = snippet + "...";
            
            snippets.push(snippet);
            addedSnippetCenters.push(matchIndex);
        }
        
        matchIndex = plainTextLower.indexOf(mainToken, matchIndex + mainToken.length);
    }
    
    return snippets;
}

/**
 * 第 5 步：提供给对外的全文搜索接口 (支持多条高亮上下文)
 */
export const searchArticlesWithMeili = async (query: string, titleOnly: boolean = false, userId: string): Promise<ArticleSearchResult[]> => {
    // 只有传入了非空字符串才去搜索
    if (!query.trim()) return [];

    const result = await getArticleSearchIndex().search<SearchableArticle>(query, {
        // 核心安全控制：只能搜出当前用户自己的文章！
        filter: `userId = "${userId}"`,
        // 强制所有词元必须匹配，避免长句子拆词后搜出一堆无关文章
        matchingStrategy: "all",
        // 是否只在标题中搜索
        attributesToSearchOn: titleOnly ? ['title'] : ['title', 'content', 'tags'],
        // 按照时间倒序
        sort: ['updatedAt:desc', 'createdAt:desc'],
        // 我们不再依赖 Meilisearch 自带的单一 crop，而是把全量数据拿回来自己切分子句
        limit: 50,
    });

    // 为每个命中的文章计算多个匹配上下文
    const enhancedHits: ArticleSearchResult[] = result.hits.map(hit => {
        const snippets = extractMultipleSnippets(hit.content, query);
        return {
            ...hit,
            snippets,
        };
    });

    return enhancedHits;
};
