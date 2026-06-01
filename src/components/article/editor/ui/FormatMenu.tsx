import { Sparkles, Link as LinkIcon, ImagePlus, Copy, ExternalLink } from "lucide-react";
import { Editor } from "@tiptap/react";

export interface FormatMenuProps {
    editor: Editor | null;
    isLinkPanelOpen: boolean;
    setIsLinkPanelOpen: (isOpen: boolean) => void;
    setLinkText: (text: string) => void;
    setLinkHref: (href: string) => void;
    isUploadingImage: boolean;
    handleImageUploadClick: () => void;
    setIsAiMenuOpen: (isOpen: boolean) => void;
}

export function FormatMenu({
    editor,
    isLinkPanelOpen,
    setIsLinkPanelOpen,
    setLinkText,
    setLinkHref,
    isUploadingImage,
    handleImageUploadClick,
    setIsAiMenuOpen,
}: FormatMenuProps) {
    if (!editor) return null;

    return (
        <div className="bubble-menu flex items-center bg-background/80 backdrop-blur-xl border border-primary/20 text-foreground rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-white/10 p-1.5 gap-1 relative overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-primary/5 before:to-transparent">
            {/* AI 按钮 */}
            <button
                onClick={() => setIsAiMenuOpen(true)}
                className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all"
                title="✨ Ask AI"
            >
                <Sparkles size={15} className="animate-pulse duration-2000" />
            </button>
            <div className="w-[1px] h-4 bg-border/60 mx-1" />
            {/* 基础工具栏 */}
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition-all ${editor.isActive("bold") ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
            >
                <span className="font-bold text-[14px]">B</span>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition-all ${editor.isActive("italic") ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
            >
                <span className="italic text-[14px]">I</span>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition-all ${editor.isActive("strike") ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
            >
                <span className="line-through text-[14px]">S</span>
            </button>
            <div className="w-[1px] h-4 bg-border/60 mx-1" />
            <button
                onClick={() => {
                    const { from, to } = editor.state.selection;
                    const text = editor.state.doc.textBetween(from, to, " ");

                    setLinkText(text || "新建链接");
                    setLinkHref(
                        editor.isActive("link")
                            ? editor.getAttributes("link").href
                            : "",
                    );
                    setIsLinkPanelOpen(true);
                }}
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition-all ${editor.isActive("link") || isLinkPanelOpen ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
            >
                <LinkIcon size={14} />
            </button>
            <button
                onClick={handleImageUploadClick}
                disabled={isUploadingImage}
                className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all disabled:opacity-50"
                title="插入图片"
            >
                {isUploadingImage ? (
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                    <ImagePlus size={14} />
                )}
            </button>
            {editor.isActive("link") && (
                <>
                    <div className="w-[1px] h-4 bg-border/60 mx-1" />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(
                                editor.getAttributes("link").href,
                            );
                        }}
                        className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
                        title="复制链接"
                    >
                        <Copy size={13} />
                    </button>
                    <a
                        href={editor.getAttributes("link").href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
                        title="访问链接"
                    >
                        <ExternalLink size={14} />
                    </a>
                </>
            )}
        </div>
    );
}
