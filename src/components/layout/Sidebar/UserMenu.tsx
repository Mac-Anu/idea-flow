"use client";
import { useState, useRef } from "react";
import { authClient } from "@/api/auth";
import { LogOut, Settings, Image as ImageIcon, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export const UserMenu = () => {
    const { data: session, isPending } = authClient.useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    if (isPending || !session) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 shadow-sm">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="space-y-2 flex-1">
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
            </div>
        );
    }

    const user = session.user;
    const initial = user.name?.charAt(0).toUpperCase() || "U";

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/");
    };

    const handleUploadClick = () => {
        setIsOpen(false);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 这里为了演示直接采用 Base64 编码存入 image 字段
        // 如果你需要正式环境，应该对接 OSS/S3 拿到 URL 后再存入
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setIsUploading(true);
            try {
                // Better Auth 自带的 update user api
                await authClient.updateUser({ image: base64String });
            } catch (error) {
                console.error("更新头像失败:", error);
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between rounded-2xl border border-border bg-card/70 px-3 py-2.5 shadow-sm hover:bg-accent/50 transition-colors group"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary overflow-hidden border border-primary/20">
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : user.image ? (
                            <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-lg font-bold">{initial}</span>
                        )}
                    </div>
                    <div className="min-w-0 text-left">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80 truncate">
                            {user.displayUsername || user.username || "Personal Workspace"}
                        </p>
                        <span className="text-[14px] font-semibold text-foreground truncate block mt-0.5">
                            {user.name}
                        </span>
                    </div>
                </div>
                <ChevronDown size={14} className="text-muted-foreground/50 group-hover:text-foreground transition-colors mr-1" />
            </button>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* 下拉菜单 */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-full z-50 rounded-[20px] border border-border bg-popover text-popover-foreground shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
                            <p className="text-[13px] font-semibold">{user.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{user.email}</p>
                        </div>
                        
                        <div className="p-1.5 space-y-0.5">
                            <button 
                                onClick={handleUploadClick}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <ImageIcon size={14} />
                                更换头像
                            </button>
                            
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <Settings size={14} />
                                账号设置
                            </button>
                        </div>

                        <div className="p-1.5 border-t border-border mt-1">
                            <button 
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                                <LogOut size={14} />
                                退出登录
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
