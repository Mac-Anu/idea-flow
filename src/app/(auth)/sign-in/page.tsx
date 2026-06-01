import { Metadata } from "next";
import { SignInForm } from "@/components/auth/forms/signIn";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "用户登录 - 创想流",
    description: "登录 创想流 账号，继续你的灵感旅程",
};

export default function SignInPage() {
    return (
        <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border shadow-[0_8px_24px_rgba(0,200,255,0.15)] mb-5">
                    <Sparkles className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    欢迎回来
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    继续记录你的灵感与思考
                </p>
            </div>

            {/* 卡片容器 */}
            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[28px] shadow-lg p-8 space-y-6">
                <SignInForm />

                <div className="pt-2 text-center text-sm border-t border-border mt-6">
                    <span className="text-muted-foreground">还没有账号？</span>{" "}
                    <Link
                        href="/sign-up"
                        className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                    >
                        免费注册
                    </Link>
                </div>
            </div>
        </div>
    );
}
