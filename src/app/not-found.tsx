"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
            {/* Ambient glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative text-center max-w-md">
                <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-muted border border-border shadow-lg">
                    <FileQuestion size={36} className="text-muted-foreground" />
                </div>

                <h1 className="text-7xl font-black tracking-tighter text-foreground mb-2">
                    4<span className="text-primary">0</span>4
                </h1>

                <p className="text-lg text-muted-foreground mb-2">
                    页面走丢了
                </p>
                <p className="text-sm text-muted-foreground/70 mb-10">
                    你访问的页面不存在或已被移除
                </p>

                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all shadow-sm"
                    >
                        <Home size={16} />
                        返回首页
                    </Link>
                    <button
                        onClick={() => typeof window !== 'undefined' && window.history.back()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-all"
                    >
                        <ArrowLeft size={16} />
                        返回上页
                    </button>
                </div>
            </div>
        </div>
    );
}
