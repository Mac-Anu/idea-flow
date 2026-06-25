"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteApiClient } from "@/api/site";
import type { SiteProfile, SocialLink } from "@/server/site/type";

/**
 * 站点 Profile 编辑表单（后台 /manage/profile）。
 * 编辑公开站的版头、头像、名字、头衔、bio、社媒链接。头像/背景图复用 /api/upload。
 *
 * @param profile - 现有 Profile，可能为 null（首次创建）
 */
export function SiteProfileForm({ profile }: { profile: SiteProfile | null }) {
    const router = useRouter();

    const [headline, setHeadline] = useState(profile?.headline ?? "");
    const [intro, setIntro] = useState(profile?.intro ?? "");
    const [name, setName] = useState(profile?.name ?? "");
    const [title, setTitle] = useState(profile?.title ?? "");
    const [bio, setBio] = useState(profile?.bio ?? "");
    const [avatar, setAvatar] = useState(profile?.avatar ?? "");
    const [bannerImage, setBannerImage] = useState(profile?.bannerImage ?? "");
    const [socials, setSocials] = useState<SocialLink[]>(profile?.socials ?? []);

    const [saving, setSaving] = useState(false);
    const [uploadingKey, setUploadingKey] = useState<"avatar" | "banner" | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const uploadImage = async (file: File, target: "avatar" | "banner") => {
        const formData = new FormData();
        formData.append("file", file);
        setUploadingKey(target);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || "图片上传失败");
                return;
            }
            const { url } = await res.json();
            if (target === "avatar") {
                setAvatar(url);
            } else {
                setBannerImage(url);
            }
            toast.success("图片已上传");
        } catch {
            toast.error("图片上传失败，请检查网络");
        } finally {
            setUploadingKey(null);
        }
    };

    const addSocial = () => setSocials([...socials, { label: "", href: "", iconKey: "globe" }]);
    const updateSocial = (i: number, patch: Partial<SocialLink>) =>
        setSocials(socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    const removeSocial = (i: number) => setSocials(socials.filter((_, idx) => idx !== i));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await siteApiClient.update({
                headline,
                intro,
                name,
                title,
                bio,
                avatar: avatar || null,
                bannerImage: bannerImage || null,
                socials: socials.filter((s) => s.label.trim() && s.href.trim()),
            });
            if (!res.ok) {
                toast.error("保存失败");
                return;
            }
            toast.success("Profile 已保存");
            router.refresh();
        } catch {
            toast.error("保存失败，请稍后重试");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">站点 Profile</h1>
                    <p className="mt-1 text-sm text-muted-foreground">编辑公开主页的版头、头像与社媒链接。</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    保存
                </Button>
            </div>

            <div className="space-y-6">
                {/* 头像 */}
                <Field label="头像">
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadImage(f, "avatar");
                            e.target.value = "";
                        }}
                    />
                    <div className="flex items-center gap-4">
                        {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt="头像" className="h-20 w-20 rounded-2xl border border-border object-cover" />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground/40">
                                <ImageIcon className="h-6 w-6" />
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={uploadingKey === "avatar"}>
                                {uploadingKey === "avatar" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                上传
                            </Button>
                            {avatar && (
                                <Button size="sm" variant="ghost" onClick={() => setAvatar("")}>
                                    <X className="h-3.5 w-3.5" />
                                    移除
                                </Button>
                            )}
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        提示：登录后你的账号头像会优先显示。这里设置的是站点默认头像（访客/未设账号头像时显示）。
                    </p>
                </Field>

                {/* 版头标题 */}
                <Field label="版头标题">
                    <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Hi, I'm Mac-Anu 👋" />
                </Field>

                {/* 版头介绍 */}
                <Field label="版头自我介绍">
                    <textarea
                        value={intro}
                        onChange={(e) => setIntro(e.target.value)}
                        rows={4}
                        placeholder="一段自我介绍，会显示在首页版头。"
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                    />
                </Field>

                {/* 版头背景图 */}
                <Field label="版头背景图（可选）">
                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadImage(f, "banner");
                            e.target.value = "";
                        }}
                    />
                    {bannerImage ? (
                        <div className="group relative overflow-hidden rounded-2xl border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={bannerImage} alt="背景预览" className="aspect-[21/9] w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button size="sm" variant="secondary" onClick={() => bannerInputRef.current?.click()}>
                                    <Upload className="h-3.5 w-3.5" />
                                    更换
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => setBannerImage("")}>
                                    <X className="h-3.5 w-3.5" />
                                    移除
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={uploadingKey === "banner"}
                            className="flex aspect-[21/9] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                        >
                            {uploadingKey === "banner" ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                            <span className="text-sm">点击上传背景图</span>
                        </button>
                    )}
                </Field>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="展示名">
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mac-Anu" />
                    </Field>
                    <Field label="头衔">
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="TypeScript 全栈 / AI 自动化" />
                    </Field>
                </div>

                <Field label="侧边栏简短 bio">
                    <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="一句话简介，显示在侧边栏头像下方。" />
                </Field>

                {/* 社媒链接 */}
                <Field label="社媒链接">
                    <div className="space-y-2">
                        {socials.map((s, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    value={s.label}
                                    onChange={(e) => updateSocial(i, { label: e.target.value })}
                                    placeholder="名称 (GitHub)"
                                    className="w-32"
                                />
                                <select
                                    value={s.iconKey}
                                    onChange={(e) => updateSocial(i, { iconKey: e.target.value })}
                                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm dark:bg-input/30"
                                >
                                    <option value="github">github</option>
                                    <option value="mail">mail</option>
                                    <option value="globe">globe</option>
                                    <option value="twitter">twitter</option>
                                    <option value="linkedin">linkedin</option>
                                </select>
                                <Input
                                    value={s.href}
                                    onChange={(e) => updateSocial(i, { href: e.target.value })}
                                    placeholder="https://…"
                                    className="flex-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeSocial(i)} className="shrink-0 text-muted-foreground hover:text-destructive">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addSocial}>
                            <Plus className="h-4 w-4" />
                            添加链接
                        </Button>
                    </div>
                </Field>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
            {children}
        </div>
    );
}
