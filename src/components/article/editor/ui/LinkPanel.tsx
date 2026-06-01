import { Link as LinkIcon, Trash2 } from "lucide-react";
import { Editor } from "@tiptap/react";
import { RefObject } from "react";

export interface LinkPanelProps {
    editor: Editor | null;
    linkHref: string;
    setLinkHref: (href: string) => void;
    linkText: string;
    setLinkText: (text: string) => void;
    isLinkPanelOpen: boolean;
    setIsLinkPanelOpen: (isOpen: boolean) => void;
    panelRef: RefObject<HTMLDivElement | null>;
}

export function LinkPanel({
    editor,
    linkHref,
    setLinkHref,
    linkText,
    setLinkText,
    isLinkPanelOpen,
    setIsLinkPanelOpen,
    panelRef,
}: LinkPanelProps) {
    if (!isLinkPanelOpen || !editor) return null;

    const saveLink = () => {
        if (!linkHref) return;
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: linkHref })
            .insertContent(linkText)
            .run();
        setIsLinkPanelOpen(false);
    };

    const removeLink = () => {
        editor.chain().focus().unsetLink().run();
        setIsLinkPanelOpen(false);
    };

    return (
        <div
            ref={panelRef}
            className="bg-popover text-popover-foreground rounded-xl shadow-lg border border-border p-4 w-[320px] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground px-1">
                    页面或 URL
                </label>
                <div className="flex items-center bg-background border border-border rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <LinkIcon size={14} className="text-muted-foreground shrink-0 mr-2" />
                    <input
                        type="text"
                        value={linkHref}
                        onChange={(e) => setLinkHref(e.target.value)}
                        placeholder="https:// 或搜索内容..."
                        className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground/50"
                        autoFocus
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground px-1">
                    链接标题
                </label>
                <div className="flex items-center bg-background border border-border rounded-lg px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <input
                        type="text"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        placeholder="输入的显示文字"
                        className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
                <button
                    onClick={removeLink}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-destructive hover:bg-destructive/10 px-2 py-1.5 rounded-md transition-colors"
                >
                    <Trash2 size={13} />
                    移除链接
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsLinkPanelOpen(false)}
                        className="text-[12px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={saveLink}
                        className="text-[12px] font-bold text-primary-foreground bg-primary hover:opacity-90 px-3 py-1.5 rounded-md shadow-sm transition-colors"
                    >
                        应用
                    </button>
                </div>
            </div>
        </div>
    );
}
