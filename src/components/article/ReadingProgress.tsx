"use client";

import { useEffect, useState } from "react";

/**
 * 阅读进度条
 * 固定在页面顶部，随页面滚动从左到右填充，提示读者当前阅读进度。
 *
 * 原理：
 *  - 页面可滚动的总距离 = 文档总高度 - 视口高度 (scrollHeight - clientHeight)
 *  - 已滚动距离 = window.scrollY
 *  - 进度 = 已滚动 / 可滚动总距离 × 100%
 *  - 用 requestAnimationFrame 节流，避免每次 scroll 都重算导致卡顿。
 */
export function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let ticking = false;

        const update = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            // docHeight 为 0 时（内容没超出一屏）直接视为 0，避免除以 0
            const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
            setProgress(pct);
            ticking = false;
        };

        const onScroll = () => {
            // 节流：一帧内只计算一次，scroll 事件触发很密集，不节流会浪费性能
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        };

        update(); // 首次进入先算一次（比如刷新时页面已经在中间位置）
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent pointer-events-none">
            <div
                className="h-full bg-primary transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
