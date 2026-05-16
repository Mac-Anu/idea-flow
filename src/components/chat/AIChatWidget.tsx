"use client";

import { Sparkles, X, Send, User, Bot, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAIChat } from "./hooks/useAIChat";

export const AIChatWidget = () => {
    const {
        isOpen,
        setIsOpen,
        inputValue,
        setInputValue,
        messages,
        isLoading,
        messagesEndRef,
        handleSend
    } = useAIChat();

    return (
        <>
            {/* Desktop: Floating Button / Mobile: Bottom Bar */}
            <div className={cn(
                "fixed z-50 transition-all duration-300",
                isOpen ? "opacity-0 pointer-events-none" : "opacity-100",
                "flex",
                // 电脑端：定位到右下角，去掉手机端的背景和边框，重置 left-0
                "md:bottom-8 md:right-8 md:left-auto md:w-auto md:p-0 md:bg-transparent md:border-none md:shadow-none md:backdrop-blur-none",
                // 手机端：底部吸附栏
                "bottom-0 left-0 right-0 p-4 pb-6 bg-background/90 backdrop-blur-xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
            )}>
                {/* 电脑端触发按钮 */}
                <button 
                    onClick={() => setIsOpen(true)}
                    className="hidden md:flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    title="万事问 AI"
                >
                    <Sparkles className="w-6 h-6" />
                </button>

                {/* 手机端触发条 */}
                <button 
                    onClick={() => setIsOpen(true)}
                    className="md:hidden flex items-center gap-2 w-full bg-card border border-border px-4 py-3 rounded-2xl shadow-sm text-muted-foreground active:scale-[0.98] transition-transform"
                >
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground/80">万事问 AI ...</span>
                </button>
            </div>

            {/* 聊天对话框面板 */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* 手机端背后的变暗遮罩层 */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] md:hidden"
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={cn(
                                "fixed z-[70] flex flex-col bg-card overflow-hidden",
                                // 电脑端样式：右下角的一个优雅弹窗，重置 left-0
                                "md:bottom-8 md:right-8 md:left-auto md:w-[380px] md:h-[600px] md:rounded-3xl md:border md:border-border md:shadow-2xl",
                                // 手机端样式：底部抽屉 (Bottom Sheet)
                                "bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                            )}
                        >
                            {/* 头部栏 */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/50 backdrop-blur-sm relative shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[15px] text-foreground tracking-tight">IdeaFlow AI</h3>
                                        <p className="text-[11px] text-muted-foreground">基于 LangGraph 反思工作流</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* 消息对话区域 */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={cn("flex items-start gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                                        {msg.role === "assistant" ? (
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                                                <Bot className="w-4 h-4 text-primary" />
                                            </div>
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 border border-border mt-0.5">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "px-4 py-2.5 rounded-2xl text-[15px] max-w-[85%] leading-relaxed whitespace-pre-wrap shadow-sm",
                                            msg.role === "assistant" 
                                                ? "bg-muted rounded-tl-sm text-foreground" 
                                                : "bg-primary text-primary-foreground rounded-tr-sm"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}

                                {/* 加载状态动画 */}
                                {isLoading && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                                            <Bot className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* 底部输入框区域 */}
                            <div className="p-4 border-t border-border bg-card shrink-0">
                                <div className="relative flex items-end gap-2 bg-muted/50 border border-border rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <textarea 
                                        rows={1}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder="问点什么..."
                                        className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 px-2.5 text-[15px] text-foreground placeholder:text-muted-foreground max-h-32 outline-none"
                                        disabled={isLoading}
                                    />
                                    <button 
                                        onClick={handleSend}
                                        className="p-2 bg-primary text-primary-foreground rounded-xl shadow-sm hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
                                        disabled={!inputValue.trim() || isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-[10px] text-muted-foreground/60">AI 生成内容可能存在误差，请自行甄别。</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
