import { Plus } from "lucide-react";
import { Editor } from "@tiptap/react";

export function DragHandle({ editor }: { editor: Editor | null }) {
    if (!editor) return null;
    return (
        <div className="custom-drag-handle drag-handle hide relative w-0 h-[28px] opacity-0 transition-opacity duration-200 text-muted-foreground">
            <div className="absolute right-2 top-0 flex items-center justify-end gap-1 w-max h-full">
                <button
                    className="flex items-center justify-center w-6 h-6 rounded-[4px] hover:bg-muted transition-colors cursor-pointer shrink-0"
                    title="点击添加区块"
                    onClick={(e) => {
                        e.stopPropagation(); // 阻止触发拖拽
                        editor.chain().focus().insertContent('\n').run();
                    }}
                >
                    <Plus size={18} strokeWidth={2.5} className="opacity-70" />
                </button>
                <div
                    className="flex items-center justify-center w-4 h-6 rounded-[4px] hover:bg-muted transition-colors cursor-grab active:cursor-grabbing shrink-0"
                    title="拖拽移动区块"
                >
                    <svg
                        viewBox="0 0 14 14"
                        className="w-[14px] h-[14px] opacity-70"
                        fill="currentColor"
                    >
                        <path d="M4.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5-11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
