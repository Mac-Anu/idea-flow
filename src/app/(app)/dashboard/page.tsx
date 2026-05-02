"use client";

import {
    Sparkles,
    ArrowUpRight,
    Plus,
    Zap,
    Heart,
    MessageCircle,
    LayoutGrid,
    Clock,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function DashboardPage() {
    const containerRef = useRef(null);
    const { scrollY } = useScroll();

    // 🍎 iOS 26 核心交互：标题随滚动发生“液态收缩”和模糊增强
    const headerBgOpacity = useTransform(scrollY, [0, 50], [0, 0.9]);
    const headerBlur = useTransform(scrollY, [0, 50], [0, 20]);
    const headerScale = useTransform(scrollY, [0, 50], [1, 0.98]);

    return (
        <div ref={containerRef} className="relative pb-24 text-white">
            {/* 🍎 iOS 26 环境氛围灯 (黑色背景下的霓虹感) */}
            <div className="fixed -top-24 -right-24 w-[500px] h-[500px] bg-white/5 blur-[130px] rounded-full pointer-events-none" />
            <div className="fixed top-1/2 -left-24 w-[400px] h-[400px] bg-white/5 blur-[110px] rounded-full pointer-events-none" />

            {/* 🍎 Liquid Floating Header - Deep Dark Edit */}
            <motion.header
                style={{
                    backgroundColor: `rgba(0, 0, 0, ${headerBgOpacity.get()})`,
                    backdropFilter: `blur(${headerBlur.get()}px)`,
                    scale: headerScale,
                }}
                className="sticky top-0 z-50 py-6 mb-10 flex items-end justify-between transition-shadow duration-300"
            >
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white">灵感空间</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-zinc-500 text-sm font-medium">Deep Dark Engine Active</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-3 rounded-2xl bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors">
                        <LayoutGrid size={20} />
                    </button>
                    <button className="group relative px-6 py-3 rounded-2xl bg-white overflow-hidden transition-all hover:scale-105 active:scale-95">
                        <div className="absolute inset-0 bg-linear-to-r from-zinc-600 to-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 flex items-center gap-2 text-black group-hover:text-white font-bold transition-colors">
                            <Plus size={20} />
                            新想法
                        </span>
                    </button>
                </div>
            </motion.header>

            <div className="relative z-10 space-y-12">
                {/* 🧊 Stats Grid - Midnight Glass Variant */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <LiquidStatCard
                        label="捕获灵感"
                        value="1,280"
                        trend="+12%"
                        icon={<Sparkles className="text-amber-400" />}
                    />
                    <LiquidStatCard
                        label="思维触达"
                        value="85.4k"
                        trend="+5.2%"
                        icon={<Zap className="text-blue-400" />}
                    />
                    <LiquidStatCard
                        label="社区心跳"
                        value="432"
                        trend="稳定"
                        icon={<Heart className="text-rose-400" />}
                    />
                </div>

                {/* 🖼️ Main Feed - Content for Scrolling */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-black text-zinc-600 uppercase tracking-[0.3em]">
                            近期捕捉
                        </h2>
                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                            <Clock size={14} />
                            按时间排序
                        </div>
                    </div>

                    <div className="grid gap-8">
                        {/* Featured Large Card - Midnight Liquid */}
                        <div className="group relative p-px rounded-4xl bg-linear-to-b from-white/10 to-transparent shadow-2xl">
                            <div className="relative overflow-hidden rounded-4xl bg-white/5 backdrop-blur-3xl p-8 border border-white/5">
                                <div className="absolute -inset-full bg-linear-to-r from-transparent via-white/5 to-transparent rotate-45 transition-transform duration-1000 group-hover:translate-x-full" />

                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="w-full md:w-56 h-56 rounded-3xl bg-linear-to-br from-zinc-600 to-zinc-700 p-px">
                                        <div className="w-full h-full rounded-3xl bg-black/40 backdrop-blur-md flex items-center justify-center shadow-inner">
                                            <Sparkles size={64} className="text-white/20" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20">
                                                Research
                                            </span>
                                            <span className="text-zinc-500 text-xs font-bold font-mono">
                                                2026.02.01
                                            </span>
                                        </div>
                                        <h3 className="text-4xl font-black text-white leading-[1.1] tracking-tighter">
                                            Liquid Glass: 浏览器端
                                            <br />
                                            流体设计的极限性能
                                        </h3>
                                        <p className="text-zinc-400 leading-relaxed text-lg font-medium max-w-lg">
                                            如何利用 WebGL 与 Framer Motion 在 120Hz
                                            刷新率下保持极致流畅的玻璃折射效果...
                                        </p>
                                        <div className="flex items-center gap-6 pt-4">
                                            <div className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer">
                                                <MessageCircle size={20} />
                                                <span className="text-sm font-bold">42</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer">
                                                <Heart size={20} />
                                                <span className="text-sm font-bold">2.8k</span>
                                            </div>
                                            <Link
                                                href="/dashboard/idea/liquid-glass"
                                                className="ml-auto"
                                            >
                                                <button className="p-4 rounded-2xl bg-white text-black hover:scale-110 transition-transform">
                                                    <ArrowUpRight size={20} />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra Content for Scrolling Test */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/5 p-6 hover:bg-white/10 hover:shadow-2xl transition-all duration-500"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center transition-transform group-hover:rotate-12">
                                            <Zap size={18} className="text-zinc-400" />
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-600 uppercase letter tracking-widest">
                                            Inspiration #{i}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">
                                        幻影笔记标题 {i}
                                    </h4>
                                    <p className="text-zinc-500 text-sm line-clamp-2 font-medium">
                                        这是一段在纯黑环境下呈现的笔记描述，展示了极其深邃且具有呼吸感的
                                        UI 质感...
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function LiquidStatCard({
    label,
    value,
    trend,
    icon,
}: {
    label: string;
    value: string;
    trend: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="group relative p-px rounded-3xl bg-linear-to-br from-white/10 via-transparent to-transparent">
            <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-2xl p-6 border border-white/5 shadow-xl transition-all hover:translate-y-[-4px] hover:shadow-black/20">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <span
                        className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend.includes("+") ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-zinc-500"}`}
                    >
                        {trend}
                    </span>
                </div>
                <div>
                    <p className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest">
                        {label}
                    </p>
                    <p className="text-4xl font-black text-white mt-1 tracking-tighter">{value}</p>
                </div>
            </div>
        </div>
    );
}
