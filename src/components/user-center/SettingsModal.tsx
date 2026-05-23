"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MonitorSmartphone, Palette, Users, CreditCard, LogOut, CheckCircle2 } from "lucide-react";
import { useSettingsStore } from "@/hooks/useSettingsStore";
import { authClient } from "@/api/auth";
import { useRouter } from "next/navigation";

export const SettingsModal = () => {
    const { isOpen, closeSettings, activeTab, setTab } = useSettingsStore();
    const { data: session } = authClient.useSession();
    const router = useRouter();

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    // Keyboard shortcut to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeSettings();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closeSettings]);

    if (!isOpen || !session) return null;

    const user = session.user;

    const menuItems = [
        { id: "profile", label: "账号", icon: <User size={16} /> },
        { id: "sessions", label: "设备与安全", icon: <MonitorSmartphone size={16} /> },
        { id: "appearance", label: "偏好设置", icon: <Palette size={16} /> },
        { id: "separator", label: "", icon: null },
        { id: "organization", label: "工作空间", icon: <Users size={16} />, locked: true },
        { id: "billing", label: "订阅方案", icon: <CreditCard size={16} />, locked: true },
    ] as const;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            >
                {/* Backdrop Blur */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={closeSettings}
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative flex h-[85vh] w-full max-w-5xl flex-col sm:flex-row overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
                >
                    {/* Sidebar */}
                    <div className="w-full sm:w-64 flex-shrink-0 border-r border-white/5 bg-zinc-900/50 p-4 sm:p-6 flex flex-col">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-white tracking-tighter">设置</h2>
                            <p className="text-xs text-zinc-500 mt-1">{user.email}</p>
                        </div>

                        <nav className="flex-1 space-y-1">
                            {menuItems.map((item) => {
                                if (item.id === "separator") {
                                    return <div key="sep" className="h-px bg-white/5 my-4" />;
                                }

                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => !item.locked && setTab(item.id as any)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            isActive
                                                ? "bg-white/10 text-white shadow-sm"
                                                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                        } ${item.locked ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={isActive ? "text-white" : "text-zinc-500"}>
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </div>
                                        {item.locked && (
                                            <span className="text-[9px] uppercase tracking-wider font-bold bg-white/5 px-1.5 py-0.5 rounded text-zinc-500">
                                                Pro
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-4 border-t border-white/5">
                            <button 
                                onClick={async () => {
                                    await authClient.signOut();
                                    router.push("/");
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500/80 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                            >
                                <LogOut size={16} />
                                退出登录
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 sm:p-10 relative">
                        {/* Close Button */}
                        <button 
                            onClick={closeSettings}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="max-w-2xl mx-auto space-y-12">
                            {activeTab === "profile" && <ProfilePanel user={user} />}
                            {activeTab === "sessions" && <SessionsPanel />}
                            {activeTab === "appearance" && <AppearancePanel />}
                            {(activeTab === "organization" || activeTab === "billing") && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6">
                                        <div className="w-8 h-8 text-zinc-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">即将推出</h3>
                                    <p className="text-zinc-500 max-w-sm">
                                        我们正在日以继夜地开发高级团队协作与商业化计费功能，敬请期待。
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// --- Sub Panels ---

function ProfilePanel({ user }: { user: any }) {
    const initial = user.name?.charAt(0).toUpperCase() || "U";
    
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-white">账号</h3>
                <p className="text-zinc-500 text-sm mt-1">管理您的个人资料和基础信息</p>
            </div>

            <div className="flex items-center gap-6 p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-white overflow-hidden border border-white/10">
                    {user.image ? (
                        <img src={user.image} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold">{initial}</span>
                    )}
                </div>
                <div>
                    <h4 className="text-white font-medium mb-1">您的头像</h4>
                    <p className="text-sm text-zinc-500 mb-3">支持 JPG, GIF 或 PNG 格式。最大 2MB。</p>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors">
                            上传新头像
                        </button>
                        <button className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors">
                            移除
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">显示昵称</label>
                    <input 
                        defaultValue={user.name}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/5 text-white focus:outline-hidden focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">邮箱地址</label>
                    <div className="relative">
                        <input 
                            defaultValue={user.email}
                            disabled
                            className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 text-zinc-500 cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={12} /> 已验证
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 flex justify-end">
                <button className="px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all">
                    保存更改
                </button>
            </div>
        </motion.div>
    );
}

function SessionsPanel() {
    const { data: sessions, isPending } = authClient.useListSessions();

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-white">设备与安全</h3>
                <p className="text-zinc-500 text-sm mt-1">管理当前登录您的账号的所有设备和会话</p>
            </div>

            <div className="space-y-4">
                {isPending ? (
                    <div className="h-32 rounded-2xl bg-zinc-900/50 border border-white/5 animate-pulse" />
                ) : sessions?.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/50 border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <MonitorSmartphone size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h4 className="text-white font-medium capitalize">
                                        {s.userAgent?.includes("Mac") ? "Mac OS" : s.userAgent?.includes("Win") ? "Windows" : "Device"} • {s.userAgent?.includes("Chrome") ? "Chrome" : "Browser"}
                                    </h4>
                                    {/* 这里简单用 id 匹配演示，如果 better-auth 有 isCurrent 更好 */}
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                        This Device
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500 mt-1">
                                    IP: {s.ipAddress || "Unknown"} • Last active: {new Date(s.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => authClient.revokeSession({ token: s.token })}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                        >
                            踢下线
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
                <h4 className="text-rose-500 font-bold">危险操作区</h4>
                <p className="text-sm text-zinc-400 max-w-md">
                    删除账号将永久清除您的所有数据（笔记、配置、图谱）。此操作不可逆，请谨慎。
                </p>
                <button className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                    永久删除账号
                </button>
            </div>
        </motion.div>
    );
}

function AppearancePanel() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-white">偏好设置</h3>
                <p className="text-zinc-500 text-sm mt-1">调整界面的外观和交互方式</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-white/20 bg-white/5 cursor-pointer flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-colors">
                    <div className="w-32 h-20 rounded-xl bg-zinc-950 border border-white/10 shadow-inner overflow-hidden flex flex-col">
                        <div className="h-4 bg-zinc-900 border-b border-white/5" />
                        <div className="flex-1 p-2 flex gap-2">
                            <div className="w-6 bg-zinc-900 rounded" />
                            <div className="flex-1 bg-zinc-900 rounded" />
                        </div>
                    </div>
                    <span className="text-sm font-medium text-white">Deep Dark (深色)</span>
                </div>
                
                <div className="p-4 rounded-2xl border border-white/5 bg-black/20 cursor-not-allowed opacity-50 flex flex-col items-center justify-center gap-4">
                    <div className="w-32 h-20 rounded-xl bg-white border border-black/10 shadow-inner overflow-hidden flex flex-col">
                        <div className="h-4 bg-zinc-100 border-b border-black/5" />
                        <div className="flex-1 p-2 flex gap-2">
                            <div className="w-6 bg-zinc-100 rounded" />
                            <div className="flex-1 bg-zinc-100 rounded" />
                        </div>
                    </div>
                    <span className="text-sm font-medium text-zinc-500">Light (浅色) - 敬请期待</span>
                </div>
            </div>
        </motion.div>
    );
}
