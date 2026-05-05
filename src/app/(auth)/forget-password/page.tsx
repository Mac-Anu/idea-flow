import { Metadata } from "next";
import { ForgetPasswordForm } from "@/components/auth/forms/forgetPassword";
import { KeyRound } from "lucide-react";

export const metadata: Metadata = {
    title: "找回密码 - IdeaFlow",
    description: "通过邮箱验证码重置你的 IdeaFlow 账号密码",
};

export default function ForgetPasswordPage() {
    return (
        <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1f1d1a] shadow-[0_8px_24px_rgba(31,29,26,0.2)] mb-5">
                    <KeyRound className="w-5 h-5 text-[#f3ead8]" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1f1d1a]">
                    找回密码
                </h1>
                <p className="mt-2 text-sm text-[#9b8f80]">
                    通过邮箱验证码重置你的账号密码
                </p>
            </div>

            {/* 卡片容器 */}
            <div className="bg-white/80 backdrop-blur-sm border border-black/5 rounded-[28px] shadow-[0_20px_60px_rgba(33,24,14,0.08)] p-8 space-y-6">
                <ForgetPasswordForm />
            </div>
        </div>
    );
}
