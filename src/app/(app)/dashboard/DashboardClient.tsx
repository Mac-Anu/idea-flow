"use client";

import {
    FileText,
    Sparkles,
    ArrowUpRight,
    Plus,
    Clock,
    BarChart3,
    PenLine,
    Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Article {
    id: string;
    title: string;
    status?: string;
    updatedAt?: string;
    createdAt?: string;
    content?: string;
}

interface DashboardClientProps {
    articles: Article[];
    userName?: string;
}

// 统计卡片动画容器
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
    }),
};

function estimateWordCount(content?: string): number {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
    return text.length;
}

export default function DashboardClient({ articles, userName }: DashboardClientProps) {
    const totalArticles = articles.length;
    const publishedArticles = articles.filter(a => a.status === 'published').length;
    const draftArticles = totalArticles - publishedArticles;
    const totalWords = articles.reduce((sum, a) => sum + estimateWordCount(a.content), 0);

    const recentArticles = [...articles]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
        .slice(0, 5);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 6) return '夜深了';
        if (hour < 12) return '早上好';
        if (hour < 14) return '中午好';
        if (hour < 18) return '下午好';
        return '晚上好';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                    {greeting()}
                    {userName && <span className="text-primary">，{userName}</span>}
                </h1>
                <p className="mt-2 text-muted-foreground">
                    这是你的写作空间概览
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: '文章总数', value: totalArticles, icon: FileText, color: 'text-primary' },
                    { label: '已发布', value: publishedArticles, icon: Eye, color: 'text-emerald-500' },
                    { label: '草稿', value: draftArticles, icon: PenLine, color: 'text-amber-500' },
                    { label: '总字数', value: totalWords > 10000 ? `${(totalWords / 10000).toFixed(1)}万` : totalWords.toLocaleString(), icon: BarChart3, color: 'text-violet-500' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="group relative p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                    >
                        <div className={`mb-3 w-9 h-9 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={18} />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground tracking-wide">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-0.5 tracking-tight">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions + Recent Articles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="lg:col-span-1 space-y-4"
                >
                    <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">快速操作</h2>
                    <Link href="/articles/new" className="group block">
                        <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">新建文章</p>
                                    <p className="text-xs text-muted-foreground">开始记录一个新想法</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                    <Link href="/" className="group block">
                        <div className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">查看博客</p>
                                    <p className="text-xs text-muted-foreground">浏览已发布的文章</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Recent Articles */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="lg:col-span-2"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">最近编辑</h2>
                        <Link href="/articles" className="text-xs text-primary hover:underline">
                            查看全部
                        </Link>
                    </div>

                    {recentArticles.length > 0 ? (
                        <div className="space-y-2">
                            {recentArticles.map((article, i) => (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                                >
                                    <Link href={`/articles/${article.id}`} className="group block">
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                    {article.title || '无标题'}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                        article.status === 'published'
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        {article.status === 'published' ? '已发布' : '草稿'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} />
                                                        {article.updatedAt
                                                            ? new Date(article.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
                                                            : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 rounded-2xl border border-dashed border-border text-center">
                            <FileText size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">还没有文章，开始写第一篇吧</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
