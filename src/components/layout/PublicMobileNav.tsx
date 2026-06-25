"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ProfileSidebar, type SidebarProfile } from "./ProfileSidebar";

/**
 * 公开站点的移动端导航。
 * 复用 ProfileSidebar，套一个左滑抽屉，逻辑与编辑端 MobileNav 一致。
 */
export const PublicMobileNav = ({ isLoggedIn, profile }: { isLoggedIn: boolean; profile: SidebarProfile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // 路由变化时自动收起抽屉
    useEffect(() => {
        if (!isOpen) return;
        const frame = requestAnimationFrame(() => setIsOpen(false));
        return () => cancelAnimationFrame(frame);
    }, [isOpen, pathname]);

    // 抽屉展开时禁止背后页面滚动
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <>
            {/* 移动端顶部 Header */}
            <div className="relative z-40 mb-4 flex items-center justify-between rounded-[24px] border border-border bg-card/60 px-5 py-3 shadow-sm backdrop-blur-xl lg:hidden">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="rounded-[12px] border border-border bg-background p-2 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-foreground"
                    >
                        <Menu size={18} />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <img src={profile.avatar} alt={profile.name} className="h-8 w-8 rounded-[10px] shadow-sm" />
                        <span className="text-[16px] font-semibold tracking-tight text-foreground">{profile.name}</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[100] bg-[#00000021] backdrop-blur-[2px] lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="fixed inset-y-0 left-0 z-[101] flex w-[280px] py-4 pl-4 pr-2 lg:hidden"
                        >
                            <div className="w-full overflow-hidden rounded-[24px] border border-border shadow-xl">
                                <ProfileSidebar isLoggedIn={isLoggedIn} profile={profile} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
