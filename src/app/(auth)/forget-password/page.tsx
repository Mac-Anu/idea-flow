import { Metadata } from "next";
import { ForgetPasswordForm } from "@/components/auth/forms/forgetPassword";
import { KeyRound } from "lucide-react";

export const metadata: Metadata = {
    title: "找回密码 - 创想流",
    description: "通过邮箱验证码重置你的 创想流 账号密码",
};

export default function ForgetPasswordPage() {
    return (
        <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-[0_8px_24px_rgba(0,200,255,0.15)] mb-5">
                    <KeyRound className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                    找回密码
                </h1>
                <p className="mt-2 text-sm text-white/50">
                    通过邮箱验证码重置你的账号密码
                </p>
            </div>

            {/* 卡片容器 */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-8 space-y-6">
                <ForgetPasswordForm />
            </div>
        </div>
    );
}
