"use client";

import { Sparkles, Edit3, Route, Orbit } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
    }),
};

export default function Home() {
    return (
        <div className="min-h-screen bg-[#fbf9f6] text-[#2d261f] font-sans selection:bg-[#ead7b2] selection:text-[#1f1d1a]">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 border-b border-black/5 bg-[rgba(251,249,246,0.85)] backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1f1d1a] rounded-xl flex items-center justify-center shadow-sm">
                            <Sparkles className="w-4 h-4 text-[#f3ead8]" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-[#1f1d1a]">
                            IdeaFlow
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/articles">
                            <button className="px-4 py-2 bg-transparent text-[#6b6258] text-sm font-medium rounded-full hover:bg-white hover:text-[#1f1d1a] border border-transparent hover:border-black/5 transition-all">
                                随便逛逛
                            </button>
                        </Link>
                        <Link href="/articles">
                            <button className="px-4 py-2 bg-[#1f1d1a] text-white text-sm font-medium rounded-full hover:bg-[#3a342e] transition-all shadow-sm">
                                开始写作
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-40 pb-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        custom={0}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-[#8a6a2f] text-xs font-semibold mb-8 shadow-sm"
                    >
                        <Orbit className="w-3.5 h-3.5" />
                        <span className="tracking-wide">全新的数字花园</span>
                    </motion.div>

                    <motion.h1
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="text-5xl md:text-7xl font-semibold tracking-tight text-[#171411] mb-8 leading-[1.1]"
                    >
                        让凌乱的思绪，<br />生长为<span className="text-[#8a6a2f] italic px-2">知识宇宙</span>。
                    </motion.h1>

                    <motion.p
                        custom={2}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="text-lg text-[#6b6258] max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        一个极简、免打扰的书写空间。用温润的文字界面捕捉灵感，让每一个闪光点都能自然沉淀为专属你的知识结晶。
                    </motion.p>

                    <motion.div
                        custom={3}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24"
                    >
                        <Link href="/articles">
                            <button className="h-12 px-8 bg-[#1f1d1a] text-white font-medium rounded-2xl hover:bg-[#3a342e] hover:-translate-y-0.5 transition-all shadow-[0_12px_24px_rgba(31,29,26,0.15)] flex items-center justify-center gap-2 w-full sm:w-auto">
                                <Edit3 className="w-4 h-4" />
                                进入工作区
                            </button>
                        </Link>
                        <Link href="/articles">
                            <button className="h-12 px-8 bg-white border border-black/5 text-[#2d261f] font-medium rounded-2xl hover:bg-[#f3ead8] transition-all shadow-sm w-full sm:w-auto">
                                查看灵感碎片
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* Feature Grid */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: <Sparkles className="w-5 h-5 text-[#8a6a2f]" />,
                            title: "极简写作界面",
                            description: "沉浸式的奶油色界面，去除复杂的样式选项，将所有的视觉干扰降到最低。",
                        },
                        {
                            icon: <Route className="w-5 h-5 text-[#8a6a2f]" />,
                            title: "网状思维连接",
                            description: "抛弃层级森严的文件夹，让灵感在无拘无束的空间里自然产生链接与碰撞。",
                        },
                        {
                            icon: <Orbit className="w-5 h-5 text-[#8a6a2f]" />,
                            title: "实时云端同步",
                            description: "全链路毫秒级实时保存。无缝在各个设备之间穿梭，永远不会丢失任何想法。",
                        },
                    ].map((card, i) => (
                        <motion.div
                            key={card.title}
                            custom={4 + i}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                        >
                            <FeatureCard {...card} />
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-black/5 py-12 px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm font-medium text-[#9b8f80]">
                        © 2026 IdeaFlow.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="text-sm font-medium text-[#c7b9a5] hover:text-[#8a6a2f] transition-colors">关于我们</a>
                        <a href="#" className="text-sm font-medium text-[#c7b9a5] hover:text-[#8a6a2f] transition-colors">更新日志</a>
                        <a href="#" className="text-sm font-medium text-[#c7b9a5] hover:text-[#8a6a2f] transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="p-8 rounded-[28px] border border-black/5 bg-white/70 backdrop-blur-md hover:border-[#eadfcb] hover:bg-white hover:shadow-[0_20px_40px_rgba(33,24,14,0.04)] transition-all group cursor-default">
            <div className="w-12 h-12 rounded-xl bg-[#f8f5ef] border border-black/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#f3ead8] transition-transform">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-[#1f1d1a] mb-2">{title}</h3>
            <p className="text-[14px] text-[#8b8175] leading-relaxed">{description}</p>
        </div>
    );
}
