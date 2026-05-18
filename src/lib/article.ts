/**
 * 文章相关的纯工具函数
 * 用于首页、博客详情页等场景下的文本处理与数据计算
 */

/**
 * 移除 HTML 标签，返回纯文本
 * 常用于从富文本编辑器内容中提取摘要
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

/**
 * 格式化日期为中文本地化表示
 * 例如: "2026-05-17T01:00:00Z" 或 Date 对象 → "2026年5月17日"
 */
export function formatDate(dateVal: string | Date | null | undefined): string {
    if (!dateVal) return "未知时间";
    const d = new Date(dateVal);
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * 根据正文内容估算阅读时长（分钟）
 * 中文阅读速度约 400 字/分钟
 */
export function estimateReadTime(content: string): number {
    const text = stripHtml(content);
    return Math.max(1, Math.ceil(text.length / 400));
}

/**
 * 收集所有文章的标签并按出现次数降序排列
 * 用于首页侧边栏的标签云和筛选栏
 */
export function collectTags(articles: any[]): { name: string; count: number }[] {
    const tagMap = new Map<string, number>();
    articles.forEach((a) => {
        if (a.tags && Array.isArray(a.tags)) {
            a.tags.forEach((t: string) => {
                tagMap.set(t, (tagMap.get(t) || 0) + 1);
            });
        }
    });
    return Array.from(tagMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}
