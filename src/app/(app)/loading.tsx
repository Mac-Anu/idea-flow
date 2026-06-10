import { Loader2 } from "lucide-react";

/**
 * (app) 工作台分组的加载态
 * 仅填充主内容区（Sidebar 由 layout 渲染、不受影响），
 * 用中性 spinner，避免继承首页骨架屏。
 */
export default function AppLoading() {
    return (
        <div className="flex min-h-[60vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">加载中...</p>
            </div>
        </div>
    );
}
