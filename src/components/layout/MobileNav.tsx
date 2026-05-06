"use client";

import { useState, useEffect } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { Article } from "@/server/articles/type";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export const MobileNav = ({ articles }: { articles: Article[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // 路由变化时自动关闭抽屉（当你点击文章跳转时，抽屉会自动收起）
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // 抽屉展开时，禁止背后页面往下滚动
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
             document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    return (
        <>
            {/* 顶部的移动端极简 Header */}
            <div className="flex lg:hidden items-center justify-between bg-[rgba(255,251,245,0.88)] backdrop-blur-md border border-black/5 rounded-[24px] px-5 py-3 mb-4 shadow-[0_4px_20px_rgba(33,24,14,0.03)] z-40 relative">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsOpen(true)}
                        className="p-2 bg-white text-[#8a6a2f] rounded-[12px] border border-black/5 hover:bg-[#f3ead8] transition shadow-sm"
                    >
                        <Menu size={18} />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#1f1d1a] rounded-[10px] flex items-center justify-center shadow-sm">
                            <Sparkles className="w-4 h-4 text-[#f3ead8]" />
                        </div>
                        <span className="font-semibold text-[16px] text-[#1f1d1a] tracking-tight">IdeaFlow</span>
                    </div>
                </div>
            </div>

            {/* 抽屉背后的黑色半透明遮罩层 */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-[#00000021] backdrop-blur-[2px] z-[100] lg:hidden" 
                        />
                        {/* 左滑抽屉外壳 */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="fixed inset-y-0 left-0 z-[101] w-auto py-4 pl-4 pr-12 lg:hidden flex"
                        >
                            <Sidebar articles={articles} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
