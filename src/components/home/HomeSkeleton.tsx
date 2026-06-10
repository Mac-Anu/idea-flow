import { Skeleton } from "@/components/ui/skeleton";

/**
 * 首页加载骨架屏
 * 结构与真实首页同构（Hero + 双栏卡片网格 + 右侧栏），
 * 避免加载时的空白闪烁，提升感知性能。
 */
export function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            {/* 顶部导航占位 */}
            <div className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-xl" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-24 rounded-full" />
                    </div>
                </div>
            </div>

            <main className="pt-28 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Hero 占位 */}
                    <div className="mb-14">
                        <Skeleton className="h-7 w-48 rounded-full mb-5" />
                        <Skeleton className="h-12 md:h-16 w-3/4 max-w-xl mb-5" />
                        <Skeleton className="h-5 w-full max-w-2xl mb-2" />
                        <Skeleton className="h-5 w-2/3 max-w-md" />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* 左侧主内容 */}
                        <div className="flex-1 min-w-0">
                            {/* 特色文章占位 */}
                            <div className="mb-10 p-8 rounded-[24px] border border-border bg-card">
                                <div className="flex gap-2 mb-4">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-8 w-4/5 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-1/2 mb-6" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>

                            {/* 标签筛选条占位 */}
                            <div className="flex gap-2 mb-8">
                                {[64, 48, 56, 40, 48].map((w, i) => (
                                    <Skeleton key={i} className="h-8 rounded-full" style={{ width: `${w}px` }} />
                                ))}
                            </div>

                            {/* 文章卡片网格占位 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-full p-5 rounded-[20px] border border-border bg-card flex flex-col">
                                        <div className="flex gap-1.5 mb-3">
                                            <Skeleton className="h-4 w-12 rounded-full" />
                                            <Skeleton className="h-4 w-12 rounded-full" />
                                        </div>
                                        <Skeleton className="h-5 w-5/6 mb-2" />
                                        <Skeleton className="h-4 w-full mb-1.5" />
                                        <Skeleton className="h-4 w-2/3 mb-4" />
                                        <div className="flex justify-between pt-3 border-t border-border/60 mt-auto">
                                            <Skeleton className="h-3 w-32" />
                                            <Skeleton className="h-3 w-3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 右侧栏占位 */}
                        <aside className="w-full lg:w-[280px] shrink-0">
                            <div className="space-y-8">
                                <div className="rounded-[20px] border border-border bg-card p-6">
                                    <Skeleton className="h-4 w-20 mb-4" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="h-20 rounded-xl" />
                                        <Skeleton className="h-20 rounded-xl" />
                                    </div>
                                </div>
                                <div className="rounded-[20px] border border-border bg-card p-6">
                                    <Skeleton className="h-4 w-12 mb-4" />
                                    <div className="flex flex-wrap gap-2">
                                        {[56, 40, 64, 48, 48, 56, 40].map((w, i) => (
                                            <Skeleton key={i} className="h-7 rounded-full" style={{ width: `${w}px` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}
