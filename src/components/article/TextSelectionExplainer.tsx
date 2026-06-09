"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TextSelectionExplainer() {
    const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // 监听鼠标抬起事件，获取选中文本
    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            // 如果点击的是弹窗或按钮内部，不处理
            if (popoverRef.current?.contains(e.target as Node)) return;
            if (buttonRef.current?.contains(e.target as Node)) return;

            // 稍微延迟以确保浏览器完成了选区更新
            setTimeout(() => {
                const sel = window.getSelection();
                const text = sel?.toString().trim();
                
                if (text && text.length > 0 && text.length < 2000) {
                    const range = sel?.getRangeAt(0);
                    const rect = range?.getBoundingClientRect();
                    
                    if (rect) {
                        // 使用 fixed 定位，所以只用 rect 的视口坐标，抛弃 scrollY
                        setSelection({
                            text,
                            x: rect.left + rect.width / 2, // 水平居中
                            y: rect.bottom + 8, // 选区下方 8px
                        });
                        setShowPopover(false);
                        setExplanation(null);
                    }
                } else {
                    // 如果选区为空，清除状态
                    setSelection(null);
                    setShowPopover(false);
                }
            }, 10);
        };

        const handleMouseDown = (e: MouseEvent) => {
            // 点击组件自身不隐藏
            if (popoverRef.current?.contains(e.target as Node)) return;
            if (buttonRef.current?.contains(e.target as Node)) return;
            
            // 点击空白处，立刻隐藏
            setSelection(null);
            setShowPopover(false);
        };

        const handleScroll = () => {
            // 滚动时隐藏按钮，如果已经打开了 Popover 则不管
            if (!showPopover) {
                setSelection(null);
            }
        };

        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("scroll", handleScroll, { passive: true });
        
        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("scroll", handleScroll);
        };
    }, [showPopover]);

    const handleExplainClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!selection?.text) return;
        
        setShowPopover(true);
        setIsLoading(true);
        setExplanation(null);
        
        try {
            const res = await fetch("/api/agent/explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: selection.text }),
            });
            
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setExplanation(data.data.explanation);
        } catch (error) {
            console.error(error);
            setExplanation("哎呀，AI 解释失败了，请检查网络或稍后再试。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {selection && !showPopover && (
                    <motion.button
                        ref={buttonRef}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        // 这里非常关键：阻止鼠标按下默认行为，防止浏览器取消文字选区
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={handleExplainClick}
                        className="fixed z-[9999] flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white rounded-full shadow-[0_0_15px_oklch(0.7_0.19_40_/_0.3)] text-sm font-medium hover:shadow-[0_0_25px_oklch(0.7_0.19_40_/_0.6)] hover:scale-105 transition-all cursor-pointer border border-white/20 backdrop-blur-md"
                        style={{ 
                            left: `${selection.x}px`, 
                            top: `${selection.y}px`,
                            transform: "translate(-50%, 0)" // 居中并位于选区下方
                        }}
                    >
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>AI 解释</span>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showPopover && selection && (
                    <motion.div
                        ref={popoverRef}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-[9999] w-80 bg-background/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
                        style={{ 
                            left: `${selection.x}px`, 
                            top: `${selection.y}px`,
                            transform: "translate(-50%, 0)", 
                            marginTop: "5px" // 稍微隔开一点
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-primary/10 to-primary/5">
                            <div className="flex items-center gap-2 text-primary font-medium text-sm">
                                <Sparkles className="w-4 h-4" />
                                <span>创想流 AI 智能解释</span>
                            </div>
                            <button 
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setShowPopover(false); 
                                    setSelection(null); 
                                }}
                                className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4 text-sm leading-relaxed text-foreground max-h-60 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    <span className="text-xs">AI 正在思考...</span>
                                </div>
                            ) : (
                                <div className="prose prose-sm dark:prose-invert">
                                    {explanation}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
