import { Sparkles, Search, BookOpen, Wand2, PenLine } from "lucide-react";
import { Editor } from "@tiptap/react";

export interface AiMenuProps {
    editor: Editor | null;
    isAiMenuOpen: boolean;
    setIsAiMenuOpen: (isOpen: boolean) => void;
    aiLoading: boolean;
    aiExplanation: string | null;
    setAiExplanation: (text: string | null) => void;
    handleAiAction: (action: "tldr" | "polish" | "continue" | "explain") => Promise<void>;
}

export function AiMenu({
    editor,
    isAiMenuOpen,
    setIsAiMenuOpen,
    aiLoading,
    aiExplanation,
    setAiExplanation,
    handleAiAction,
}: AiMenuProps) {
    if (!isAiMenuOpen || !editor) return null;

    return (
        <div className="bg-background/80 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl p-2 w-[240px] flex flex-col gap-1 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            {aiLoading ? (
                <div className="flex flex-col items-center justify-center p-6 gap-3 text-primary">
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                    <span className="text-xs font-medium animate-pulse text-primary/80">AI 正在施展魔法...</span>
                </div>
            ) : aiExplanation ? (
                <div className="flex flex-col gap-2 p-1">
                    <div className="flex items-center justify-between px-1">
                        <div className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            智能解释
                        </div>
                    </div>
                    <div className="text-sm text-foreground/90 leading-relaxed bg-background/50 rounded-xl p-3 border border-border/50 max-h-[250px] overflow-y-auto">
                        {aiExplanation}
                    </div>
                    <button onClick={() => { setIsAiMenuOpen(false); setAiExplanation(null); }} className="text-center px-3 py-2 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors w-full mt-1">
                        关闭
                    </button>
                </div>
            ) : (
                <>
                    <div className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Ask AI
                    </div>
                    <button onClick={() => handleAiAction("explain")} className="text-left px-3 py-2.5 text-sm text-foreground hover:bg-primary/15 hover:text-primary rounded-xl transition-all flex items-center gap-3 group">
                        <Search className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" /> <span className="font-medium">解释内容</span>
                    </button>
                    <button onClick={() => handleAiAction("tldr")} className="text-left px-3 py-2.5 text-sm text-foreground hover:bg-primary/15 hover:text-primary rounded-xl transition-all flex items-center gap-3 group">
                        <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" /> <span className="font-medium">生成导读</span>
                    </button>
                    <button onClick={() => handleAiAction("polish")} className="text-left px-3 py-2.5 text-sm text-foreground hover:bg-primary/15 hover:text-primary rounded-xl transition-all flex items-center gap-3 group">
                        <Wand2 className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" /> <span className="font-medium">润色修改</span>
                    </button>
                    <button onClick={() => handleAiAction("continue")} className="text-left px-3 py-2.5 text-sm text-foreground hover:bg-primary/15 hover:text-primary rounded-xl transition-all flex items-center gap-3 group">
                        <PenLine className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" /> <span className="font-medium">帮我续写</span>
                    </button>
                    <div className="h-px bg-border/50 my-1" />
                    <button onClick={() => { setIsAiMenuOpen(false); setAiExplanation(null); }} className="text-left px-3 py-2 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors text-center w-full mt-0.5">
                        取消
                    </button>
                </>
            )}
        </div>
    );
}
