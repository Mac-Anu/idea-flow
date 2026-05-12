import { FileText, Sparkles } from "lucide-react";

export default function ArticlesPage() {
    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-3xl rounded-[28px] border border-border bg-card px-8 py-14 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <FileText size={26} />
                </div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium tracking-[0.18em] text-primary uppercase">
                    <Sparkles size={12} />
                    Portfolio Blog Workspace
                </div>
                <h2 className="mb-3 text-3xl font-semibold tracking-tight text-foreground">
                    选择一篇文章，开始打磨你的个人表达
                </h2>
                <p className="mx-auto max-w-2xl text-[15px] leading-7 text-muted-foreground">
                    把项目复盘、技术文章、学习笔记和职业思考整理成一套稳定输出的博客内容。左侧选择已有文章，
                    或点击「新建」开始写一篇更适合求职展示的作品。
                </p>
            </div>
        </div>
    );
}
