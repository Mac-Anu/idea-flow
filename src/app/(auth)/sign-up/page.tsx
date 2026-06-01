import { Metadata } from "next";
import { SignUpForm } from "@/components/auth/forms/signUp";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "注册账号 - 创想流",
    description: "加入 创想流，开启你的数字花园之旅",
};

export default function SignUpPage() {
    return (
        <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border shadow-[0_8px_24px_rgba(0,200,255,0.15)] mb-5">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    创建你的空间
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    只需几步，开启你的灵感收集之旅
                </p>
            </div>

            {/* 卡片容器 */}
            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-8 space-y-6">
                <SignUpForm />

                <div className="pt-2 text-center text-sm border-t border-border mt-6">
                    <span className="text-muted-foreground">已经有账号了？</span>{" "}
                    <Link
                        href="/sign-in"
                        className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                    >
                        直接登录
                    </Link>
                </div>
            </div>
        </div>
    );
}
