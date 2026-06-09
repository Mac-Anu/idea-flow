"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * 首页 Hero 区
 * 抽成独立 client 组件以承载 framer-motion 入场动画
 * （page.tsx 是 server async 组件，无法直接使用 motion）
 */
export function HomeHero() {
    return (
        <div className="relative mb-14">
            {/* 动态背景：两团缓慢浮动的品牌色光晕 + 细网格 */}
            <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-10 -top-24 -bottom-10 -z-10 overflow-hidden"
            >
                <div className="hero-glow hero-glow-1" />
                <div className="hero-glow hero-glow-2" />
                <div className="hero-grid absolute inset-0" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5 backdrop-blur-sm"
            >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="tracking-wide">AI 赋能的个人知识管理</span>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-5 leading-[1.05]"
            >
                思考、记录、
                <motion.span
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                    className="bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] bg-clip-text text-transparent"
                >
                    分享
                </motion.span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed"
            >
                这里记录了我的技术探索、项目复盘与成长思考。每一篇文章都是经过深度打磨的知识沉淀。
            </motion.p>
        </div>
    );
}
