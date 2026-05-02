import { FileText, Sparkles } from "lucide-react";

export default function ArticlesPage() {
    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-3xl rounded-[28px] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(252,248,240,0.94))] px-8 py-14 text-center shadow-[0_20px_60px_rgba(33,24,14,0.05)]">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3ead8] text-[#8a6a2f] shadow-sm">
                    <FileText size={26} />
                </div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[#8a6a2f] uppercase">
                    <Sparkles size={12} />
                    Portfolio Blog Workspace
                </div>
                <h2 className="mb-3 text-3xl font-semibold tracking-tight text-[#1f1d1a]">
                    选择一篇文章，开始打磨你的个人表达
                </h2>
                <p className="mx-auto max-w-2xl text-[15px] leading-7 text-[#6b6258]">
                    把项目复盘、技术文章、学习笔记和职业思考整理成一套稳定输出的博客内容。左侧选择已有文章，
                    或点击「新建」开始写一篇更适合求职展示的作品。
                </p>
            </div>
        </div>
    );
}
