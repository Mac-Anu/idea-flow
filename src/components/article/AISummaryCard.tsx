import { Sparkles } from "lucide-react";

export function AISummaryCard({ summary }: { summary?: string | null }) {
    if (!summary) return null;

    return (
        <div className="relative mb-10 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border border-primary/20 overflow-hidden group">
            {/* 炫酷的光晕背景效果 */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            
            <div className="relative z-10 flex items-start gap-4">
                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                        AI 摘要 (TL;DR)
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {summary}
                    </p>
                </div>
            </div>
        </div>
    );
}
