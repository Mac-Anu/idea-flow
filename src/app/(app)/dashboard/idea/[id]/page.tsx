'use client'

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Clock, Share2, MoreHorizontal } from "lucide-react";

export default function IdeaDetailPage() {
    const params = useParams(); // 🍎 核心：拿到网址里的 [id]
    const router = useRouter();

    return (
        <div className="min-h-screen text-white">
            {/* 返回按钮 */}
            <button
                onClick={() => router.back()}
                className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
            >
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-bold text-sm">返回仪表盘</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* 左侧：灵感内容 */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                                灵感详情
                            </span>
                            <span className="text-zinc-600 text-xs font-bold font-mono">ID: {params.id}</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-tight text-white">
                            这是关于灵感 {params.id} 的深度探讨
                        </h1>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-3xl space-y-6">
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            在这里，你可以看到网址里的动态参数是如何被 React 抓取到的。这种模式非常适合做个人网站、博客或者 SaaS 产品的详情页。
                        </p>
                        <div className="h-64 rounded-3xl bg-linear-to-br from-zinc-900 to-black border border-white/5 flex items-center justify-center">
                            <Sparkles size={48} className="text-zinc-800" />
                        </div>
                    </div>
                </div>

                {/* 右侧：元数据 */}
                <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">详情信息</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500 text-sm font-medium flex items-center gap-2">
                                    <Clock size={16} /> 创建时间
                                </span>
                                <span className="text-white text-sm font-bold">2026.02.02</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500 text-sm font-medium flex items-center gap-2">
                                    <Share2 size={16} /> 分享状态
                                </span>
                                <span className="text-emerald-500 text-sm font-bold">公开</span>
                            </div>
                        </div>
                        <div className="pt-4 flex gap-2">
                            <button className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 transition-transform">
                                编辑灵感
                            </button>
                            <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-zinc-400">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
