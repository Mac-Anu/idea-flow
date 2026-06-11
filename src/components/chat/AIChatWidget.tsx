"use client";

import { Sparkles, X, Send, User, Bot, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAIChat } from "./hooks/useAIChat";
import { ChatMarkdown } from "./ChatMarkdown";

export const AIChatWidget = () => {
    const {
        isOpen,
        setIsOpen,
        inputValue,
        setInputValue,
        messages,
        isLoading,
        messagesEndRef,
        handleSend,
        quickPrompts
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
                    className="group relative hidden md:flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    title="万事问 AI"
                >
                    <span className="absolute inset-0 rounded-2xl bg-primary/40 blur-lg opacity-60 group-hover:opacity-90 transition-opacity" />
                    <span className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary to-primary/75 flex items-center justify-center text-primary-foreground">
                        <Sparkles className="w-6 h-6" />
                    </span>
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
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 320, damping: 26 }}
                            className={cn(
                                "fixed z-[70] flex flex-col overflow-hidden",
                                // 毛玻璃卡片背景
                                "bg-card/80 backdrop-blur-2xl",
                                // 电脑端样式：右下角更大尺寸的精品弹窗
                                "md:bottom-8 md:right-8 md:left-auto md:w-[500px] md:h-[min(620px,82vh)] md:rounded-[28px] md:border md:border-border/60 md:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)]",
                                // 手机端样式：底部抽屉 (Bottom Sheet)
                                "bottom-0 left-0 right-0 h-[88vh] rounded-t-[28px] border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                            )}
                        >
                            {/* 头部栏：品牌珊瑚色渐变 + 头像光晕 */}
                            <div className="relative shrink-0 overflow-hidden border-b border-border/60">
                                {/* 渐变背景层 */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
                                <div className="relative flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {/* 光晕 */}
                                            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-md" />
                                            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                                                <Sparkles className="w-5 h-5 text-primary-foreground" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[15px] text-foreground tracking-tight flex items-center gap-2">
                                                创想流 AI
                                                <span className="flex items-center gap-1 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    在线
                                                </span>
                                            </h3>
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
                            </div>

                            {/* 消息对话区域 */}
                            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        className={cn("flex items-start gap-2.5", msg.role === "user" ? "flex-row-reverse" : "")}
                                    >
                                        {msg.role === "assistant" ? (
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                                <Bot className="w-4 h-4 text-primary-foreground" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0 border border-border mt-0.5">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl shadow-sm",
                                            msg.role === "assistant"
                                                ? "bg-muted/70 rounded-tl-md text-foreground max-w-[92%]"
                                                : "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-tr-md max-w-[85%]"
                                        )}>
                                            {msg.role === "assistant" ? (
                                                <ChatMarkdown content={msg.content} />
                                            ) : (
                                                <span className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {/* 加载状态动画 */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-2.5"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                            <Bot className="w-4 h-4 text-primary-foreground" />
                                        </div>
                                        <div className="bg-muted/70 px-4 py-3.5 rounded-2xl rounded-tl-md flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* 底部输入框区域 */}
                            <div className="p-4 border-t border-border/60 bg-card/50 backdrop-blur-sm shrink-0">
                                {/* 快捷提问按钮：未加载时展示，点击直接发送预设 prompt */}
                                {!isLoading && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {quickPrompts.map((qp) => (
                                            <button
                                                key={qp.label}
                                                onClick={() => handleSend(qp.prompt)}
                                                className="px-3 py-1.5 text-[13px] font-medium text-foreground/70 bg-muted/60 border border-border/60 rounded-full hover:bg-primary/10 hover:border-primary/40 hover:text-primary active:scale-95 transition-all"
                                            >
                                                {qp.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="relative flex items-end gap-2 bg-background/60 border border-border rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
                                    <textarea
                                        rows={2}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder="问点什么...（Shift + Enter 换行）"
                                        className="w-full bg-transparent border-none focus:ring-0 resize-none py-1.5 px-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground min-h-[3rem] max-h-40 outline-none"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        className="p-3 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-xl shadow-sm hover:shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 shrink-0"
                                        disabled={!inputValue.trim() || isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="text-center mt-2.5">
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
