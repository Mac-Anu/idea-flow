import { serverIncs } from '@/server/common/app';
import { queryArticleId } from '../service';

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
    searchInitPromise ??= rebuildArticleSearchIndex();
    return searchInitPromise;
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

/**
 * 第 5 步：提供给对外的全文搜索接口 (支持高亮)
 */
export const searchArticlesWithMeili = async (query: string, titleOnly: boolean = false, userId: string) => {
    // 只有传入了非空字符串才去搜索
    if (!query.trim()) return [];

    const result = await getArticleSearchIndex().search<SearchableArticle>(query, {
        // 核心安全控制：只能搜出当前用户自己的文章！
        filter: `userId = "${userId}"`,
        // 是否只在标题中搜索
        attributesToSearchOn: titleOnly ? ['title'] : ['title', 'content', 'tags'],
        // 按照时间倒序
        sort: ['updatedAt:desc', 'createdAt:desc'],
        // 告诉 Meilisearch 把匹配到的关键字用 <em> 包裹起来，用于前端高亮
        attributesToHighlight: ['*'],
        highlightPreTag: '<em class="search-highlight">',
        highlightPostTag: '</em>',
        // 最多返回 50 条即可
        limit: 50,
    });

    return result.hits;
};
