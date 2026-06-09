"use client";

import { useState, useEffect } from "react";
import { adminFetchClient } from "@/api/admin";
import { useAbility } from "@/components/auth/rbac";
import { ShieldAlert, Users, Key, Ban, UserCheck, Plus, Trash2, CheckCircle2 } from "lucide-react";

type AdminUser = { id: string; name: string; email: string; createdAt: string | Date; roleId?: string | null; banned: boolean };
type AdminRole = { id: string; name: string; label: string };
type AdminInvite = { id: string; code: string; used: boolean; userEmail?: string | null };

export default function AdminDashboardPage() {
    const ability = useAbility();
    const [activeTab, setActiveTab] = useState<"users" | "invites">("users");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<AdminRole[]>([]);
    const [invitations, setInvitations] = useState<AdminInvite[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes, invitesRes] = await Promise.all([
                adminFetchClient.users.$get(),
                adminFetchClient.roles.$get(),
                adminFetchClient.invitations.$get()
            ]);
            
            if (usersRes.ok) setUsers((await usersRes.json()).data);
            if (rolesRes.ok) setRoles((await rolesRes.json()).data);
            if (invitesRes.ok) setInvitations((await invitesRes.json()).data);
        } catch (e) {
            console.error("Failed to fetch admin data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ability?.can('manage', 'all')) {
            fetchData();
        }
    }, [ability]);

    if (!ability) return null;

    if (!ability.can('manage', 'all')) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center space-y-4">
                <ShieldAlert size={64} className="text-destructive/50" />
                <h1 className="text-2xl font-bold">403 Forbidden</h1>
                <p className="text-muted-foreground">您没有权限访问控制台。</p>
            </div>
        );
    }

    const handleBan = async (id: string, currentStatus: boolean) => {
        await adminFetchClient.users[":id"].ban.$patch({
            param: { id },
            json: { banned: !currentStatus }
        });
        fetchData();
    };

    const handleRoleChange = async (id: string, roleId: string) => {
        await adminFetchClient.users[":id"].role.$patch({
            param: { id },
            json: { roleId }
        });
        fetchData();
    };

    const handleGenerateCodes = async (count: number) => {
        await adminFetchClient.invitations.$post({
            json: { count }
        });
        fetchData();
    };

    const handleDeleteCode = async (id: string) => {
        await adminFetchClient.invitations[":id"].$delete({
            param: { id }
        });
        fetchData();
    };

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <header className="flex items-end justify-between border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">控制台 (Admin Console)</h1>
                    <p className="mt-2 text-sm text-muted-foreground">系统核心指挥中心，管理用户和全局权限。</p>
                </div>
            </header>

            <div className="flex space-x-2 rounded-xl bg-accent/30 p-1 w-max">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === "users" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Users size={16} /> 用户管理
                </button>
                <button
                    onClick={() => setActiveTab("invites")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === "invites" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Key size={16} /> 邀请码管理
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">数据加载中...</div>
            ) : (
                <div className="rounded-2xl border border-border bg-card">
                    {activeTab === "users" && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">用户</th>
                                        <th className="px-6 py-4 font-medium">注册时间</th>
                                        <th className="px-6 py-4 font-medium">角色指派</th>
                                        <th className="px-6 py-4 font-medium text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((u) => (
                                        <tr key={u.id} className={`transition-colors hover:bg-accent/20 ${u.banned ? "opacity-50" : ""}`}>
                                            <td className="px-6 py-4">
                                                <p className="font-medium">{u.name}</p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-hidden focus:border-primary"
                                                    value={u.roleId || ""}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                >
                                                    <option value="">(无角色)</option>
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name} ({r.label})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={async () => {
                                                        const res = await adminFetchClient.users[":id"]["force-reset-password"].$post({ param: { id: u.id }});
                                                        if (res.ok) {
                                                            const json = await res.json();
                                                            alert(`该用户密码已被强制重置为：\n\n${json.data}\n\n请复制并发送给该用户。`);
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition"
                                                    title="强制生成新密码"
                                                >
                                                    生成新密码
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if(confirm(`确定要向 ${u.email} 发送密码重置邮件吗？`)) {
                                                            const res = await adminFetchClient.users[":id"]["reset-password-email"].$post({ param: { id: u.id }});
                                                            if (res.ok) alert("已发送密码重置验证码到该邮箱！");
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition"
                                                    title="发送重置邮件"
                                                >
                                                    发重置邮件
                                                </button>
                                                <button
                                                    onClick={() => handleBan(u.id, u.banned)}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${u.banned ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
                                                >
                                                    {u.banned ? <><UserCheck size={14} /> 解封</> : <><Ban size={14} /> 封禁</>}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "invites" && (
                        <div>
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <h3 className="font-medium text-foreground">全部邀请码</h3>
                                <button
                                    onClick={() => handleGenerateCodes(5)}
                                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                                >
                                    <Plus size={16} /> 生成 5 个新码
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">邀请码</th>
                                            <th className="px-6 py-4 font-medium">状态</th>
                                            <th className="px-6 py-4 font-medium">使用者</th>
                                            <th className="px-6 py-4 font-medium text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {invitations.map((inv) => (
                                            <tr key={inv.id} className="transition-colors hover:bg-accent/20">
                                                <td className="px-6 py-4 font-mono font-bold tracking-wider">{inv.code}</td>
                                                <td className="px-6 py-4">
                                                    {inv.used ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                            <CheckCircle2 size={14} /> 已使用
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                                                            未激活
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {inv.userEmail || "-"}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteCode(inv.id)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                        title="删除邀请码"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {invitations.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-muted-foreground">
                                                    暂无邀请码，点击右上角生成。
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
