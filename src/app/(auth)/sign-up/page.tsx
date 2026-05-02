import { Metadata } from "next";
import { SignUpForm } from "@/components/auth/forms/signUp";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "注册账号 - IdeaFlow",
    description: "加入 IdeaFlow，开启你的数字花园之旅",
};

export default function SignUpPage() {
    return (
        <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1f1d1a] shadow-[0_8px_24px_rgba(31,29,26,0.2)] mb-5">
                    <Sparkles className="w-5 h-5 text-[#f3ead8]" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1f1d1a]">
                    创建你的空间
                </h1>
                <p className="mt-2 text-sm text-[#9b8f80]">
                    只需几步，开启你的灵感收集之旅
                </p>
            </div>

            {/* 卡片容器 */}
            <div className="bg-white/80 backdrop-blur-sm border border-black/5 rounded-[28px] shadow-[0_20px_60px_rgba(33,24,14,0.08)] p-8 space-y-6">
                <SignUpForm />

                <div className="pt-2 text-center text-sm border-t border-black/5">
                    <span className="text-[#9b8f80]">已经有账号了？</span>{" "}
                    <Link
                        href="/sign-in"
                        className="font-semibold text-[#8a6a2f] hover:text-[#1f1d1a] transition-colors"
                    >
                        直接登录
                    </Link>
                </div>
            </div>
        </div>
    );
}
