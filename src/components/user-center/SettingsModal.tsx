"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MonitorSmartphone, Palette, Users, CreditCard, LogOut, CheckCircle2, KeyRound } from "lucide-react";
import { useSettingsStore } from "@/hooks/useSettingsStore";
import { authClient } from "@/api/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";

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

    type MenuItem = {
        id: string;
        label: string;
        icon: React.ReactNode | null;
        locked?: boolean;
    };

    const menuItems: MenuItem[] = [
        { id: "profile", label: "账号", icon: <User size={16} /> },
        { id: "sessions", label: "设备与安全", icon: <MonitorSmartphone size={16} /> },
        { id: "appearance", label: "偏好设置", icon: <Palette size={16} /> },
        { id: "separator", label: "", icon: null },
        { id: "organization", label: "工作空间", icon: <Users size={16} />, locked: true },
        { id: "billing", label: "订阅方案", icon: <CreditCard size={16} />, locked: true },
    ];

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
                    className="absolute inset-0 bg-background/60 backdrop-blur-md"
                    onClick={closeSettings}
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative flex h-[85vh] w-full max-w-5xl flex-col sm:flex-row overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
                >
                    {/* Sidebar */}
                    <div className="w-full sm:w-64 flex-shrink-0 border-r border-border bg-muted/30 p-4 sm:p-6 flex flex-col">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-foreground tracking-tighter">设置</h2>
                            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                        </div>

                        <nav className="flex-1 space-y-1">
                            {menuItems.map((item) => {
                                if (item.id === "separator") {
                                    return <div key="sep" className="h-px bg-border my-4" />;
                                }

                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => !item.locked && setTab(item.id as any)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            isActive
                                                ? "bg-accent text-accent-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        } ${item.locked ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={isActive ? "text-accent-foreground" : "text-muted-foreground"}>
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </div>
                                        {item.locked && (
                                            <span className="text-[9px] uppercase tracking-wider font-bold bg-muted-foreground/20 px-1.5 py-0.5 rounded text-muted-foreground">
                                                Pro
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-4 border-t border-border">
                            <button 
                                onClick={async () => {
                                    await authClient.signOut();
                                    router.push("/");
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                                <LogOut size={16} />
                                退出登录
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-10 relative">
                        {/* Close Button */}
                        <button 
                            onClick={closeSettings}
                            className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="max-w-2xl mx-auto space-y-12">
                            {activeTab === "profile" && <ProfilePanel user={user} />}
                            {activeTab === "sessions" && <SessionsPanel />}
                            {activeTab === "appearance" && <AppearancePanel />}
                            {(activeTab === "organization" || activeTab === "billing") && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-muted border border-border flex items-center justify-center mb-6">
                                        <div className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">即将推出</h3>
                                    <p className="text-muted-foreground max-w-sm">
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

type SettingsUser = { name: string; email: string; image?: string | null };

function ProfilePanel({ user }: { user: SettingsUser }) {
    const initial = user.name?.charAt(0).toUpperCase() || "U";
    
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-foreground">账号</h3>
                <p className="text-muted-foreground text-sm mt-1">管理您的个人资料和基础信息</p>
            </div>

            <div className="flex items-center gap-6 p-6 rounded-2xl bg-card border border-border">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground overflow-hidden border border-border">
                    {user.image ? (
                        <img src={user.image} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold">{initial}</span>
                    )}
                </div>
                <div>
                    <h4 className="text-foreground font-medium mb-1">您的头像</h4>
                    <p className="text-sm text-muted-foreground mb-3">支持 JPG, GIF 或 PNG 格式。最大 2MB。</p>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                            上传新头像
                        </button>
                        <button className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-semibold hover:bg-accent transition-colors">
                            移除
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">显示昵称</label>
                    <input 
                        defaultValue={user.name}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">邮箱地址</label>
                    <div className="relative">
                        <input 
                            defaultValue={user.email}
                            disabled
                            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-muted-foreground cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={12} /> 已验证
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-4 border-t border-border flex justify-end">
                <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-105 active:scale-95 transition-all">
                    保存更改
                </button>
            </div>
        </motion.div>
    );
}

type SettingsSession = { id: string; userAgent: string; ipAddress: string; updatedAt: Date; token: string };

function SessionsPanel() {
    const [sessions, setSessions] = useState<SettingsSession[]>([]);
    const [isPending, setIsPending] = useState(true);
    
    // Change Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        // 模拟加载会话数据
        setTimeout(() => {
            setSessions([
                { id: "1", userAgent: navigator.userAgent, ipAddress: "127.0.0.1", updatedAt: new Date(), token: "mock-token" }
            ]);
            setIsPending(false);
        }, 800);
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("两次输入的新密码不一致");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("新密码长度不能少于 8 位");
            return;
        }
        
        setIsChangingPassword(true);
        try {
            const res = await authClient.changePassword({
                newPassword: newPassword,
                currentPassword: currentPassword,
                revokeOtherSessions: true,
            });
            if (res.error) {
                toast.error(res.error.message || "修改密码失败");
            } else {
                toast.success("密码修改成功！");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            toast.error("修改密码时出现异常");
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            {/* Change Password Section */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-foreground">修改密码</h3>
                    <p className="text-muted-foreground text-sm mt-1">定期修改密码有助于保护您的账号安全</p>
                </div>
                
                <form onSubmit={handleChangePassword} className="space-y-4 p-6 rounded-2xl bg-card border border-border">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">当前密码</label>
                        <input 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="输入当前密码"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">新密码</label>
                            <input 
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                placeholder="至少 8 位字符"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">确认新密码</label>
                            <input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                placeholder="再次输入新密码"
                            />
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={isChangingPassword}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isChangingPassword ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                <KeyRound size={16} />
                            )}
                            更新密码
                        </button>
                    </div>
                </form>
            </div>

            {/* Sessions Section */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-foreground">登录设备</h3>
                    <p className="text-muted-foreground text-sm mt-1">管理当前登录您的账号的所有设备和会话</p>
                </div>

                <div className="space-y-4">
                    {isPending ? (
                        <div className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
                    ) : sessions?.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                                    <MonitorSmartphone size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-foreground font-medium capitalize">
                                            {s.userAgent?.includes("Mac") ? "Mac OS" : s.userAgent?.includes("Win") ? "Windows" : "Device"} • {s.userAgent?.includes("Chrome") ? "Chrome" : "Browser"}
                                        </h4>
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                            This Device
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        IP: {s.ipAddress || "Unknown"} • Last active: {new Date(s.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => authClient.revokeSession({ token: s.token })}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                            >
                                踢下线
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-12 p-6 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-4">
                <h4 className="text-destructive font-bold">危险操作区</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                    删除账号将永久清除您的所有数据（笔记、配置、图谱）。此操作不可逆，请谨慎。
                </p>
                <button className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:bg-destructive/90 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                    永久删除账号
                </button>
            </div>
        </motion.div>
    );
}

function AppearancePanel() {
    const { theme, setTheme } = useTheme();

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-foreground">偏好设置</h3>
                <p className="text-muted-foreground text-sm mt-1">调整界面的外观和交互方式</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Dark Theme Option */}
                <div 
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center justify-center gap-4 transition-all ${
                        theme === "dark" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-accent"
                    }`}
                >
                    <div className="w-32 h-20 rounded-xl bg-zinc-950 border border-white/10 shadow-inner overflow-hidden flex flex-col">
                        <div className="h-4 bg-zinc-900 border-b border-white/5" />
                        <div className="flex-1 p-2 flex gap-2">
                            <div className="w-6 bg-zinc-900 rounded" />
                            <div className="flex-1 bg-zinc-900 rounded" />
                        </div>
                    </div>
                    <span className={`text-sm font-medium ${theme === "dark" ? "text-primary" : "text-foreground"}`}>深色模式</span>
                </div>
                
                {/* Light Theme Option */}
                <div 
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center justify-center gap-4 transition-all ${
                        theme === "light" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-accent"
                    }`}
                >
                    <div className="w-32 h-20 rounded-xl bg-white border border-black/10 shadow-inner overflow-hidden flex flex-col">
                        <div className="h-4 bg-zinc-100 border-b border-black/5" />
                        <div className="flex-1 p-2 flex gap-2">
                            <div className="w-6 bg-zinc-100 rounded" />
                            <div className="flex-1 bg-zinc-100 rounded" />
                        </div>
                    </div>
                    <span className={`text-sm font-medium ${theme === "light" ? "text-primary" : "text-foreground"}`}>浅色模式</span>
                </div>
            </div>
        </motion.div>
    );
}
