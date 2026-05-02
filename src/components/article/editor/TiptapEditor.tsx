"use client";
import {
    useEditor,
    EditorContent,
    ReactNodeViewRenderer,
    NodeViewWrapper,
    NodeViewContent,
    Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import Link from "@tiptap/extension-link";
import "./TiptapEditor.css";
import { useState, useRef } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Link as LinkIcon, Copy, Trash2, ExternalLink } from "lucide-react";

const lowlight = createLowlight(common);

import { useRouter } from "next/navigation";

// 可选的编程语言列表
const LANGUAGES = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "css", label: "CSS" },
    { value: "html", label: "HTML" },
    { value: "json", label: "JSON" },
    { value: "bash", label: "Bash" },
    { value: "sql", label: "SQL" },
    { value: "xml", label: "XML" },
    { value: "markdown", label: "Markdown" },
    { value: "plaintext", label: "Plain Text" },
];

interface Heading {
    level: number; // 1, 2, 3
    text: string; // 标题文字
    pos: number; // 在文档中的位置
}

// 自定义代码块的 React 渲染组件（右上角带语言选择器）
function CodeBlockView({ node, updateAttributes, extension }: any) {
    const language = node.attrs.language || "javascript";

    return (
        <NodeViewWrapper className="code-block-wrapper">
            <select
                className="code-block-language-select"
                contentEditable={false}
                value={language}
                onChange={(e) => updateAttributes({ language: e.target.value })}
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                        {lang.label}
                    </option>
                ))}
            </select>
            <pre data-language={language}>
                {/* @ts-ignore -- as="code" works at runtime, types only allow "div" */}
                <NodeViewContent as="code" />
            </pre>
        </NodeViewWrapper>
    );
}

// 扩展 CodeBlockLowlight，使用自定义 React 组件渲染
const CustomCodeBlock = CodeBlockLowlight.extend({
    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
    },
});

export const TiptapEditor = ({
    content,
    onChange,
    onHeadingsChange,
    onEditorReady,
}: {
    content: string;
    onChange: (value: string) => void;
    onHeadingsChange?: (headings: Heading[]) => void;
    onEditorReady?: (editor: Editor) => void;
}) => {
    const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
    const [linkHref, setLinkHref] = useState("");
    const [linkText, setLinkText] = useState("");

    // 我们需要一个 ref 来防止面板内的点击事件让编辑器失去焦点
    const panelRef = useRef<HTMLDivElement>(null);

    function extractHeadings(editor: Editor): Heading[] {
        const headings: Heading[] = [];
        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === "heading" && node.attrs.level <= 3) {
                headings.push({
                    level: node.attrs.level,
                    text: node.textContent,
                    pos,
                });
            }
        });
        return headings;
    }

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            CustomCodeBlock.configure({
                lowlight,
                defaultLanguage: "javascript",
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
                HTMLAttributes: {
                    target: "",
                    rel: "noopener noreferrer",
                    class: "transition-colors cursor-pointer text-[#8a6a2f] hover:text-[#2d261f] underline underline-offset-4 decoration-black/10",
                },
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
            onHeadingsChange?.(extractHeadings(editor));
        },
        onCreate: ({ editor }) => {
            onHeadingsChange?.(extractHeadings(editor));
            onEditorReady?.(editor);
        },
        onSelectionUpdate: ({ editor }) => {
            // 当光标移动时，如果离开了链接并且面板开着，可以考虑关闭。
            // 但为了体验，我们通常只在失去链接激活状态且用户没有在操作面板时关闭
            // 简单处理：只要光标没碰到链接且面板开启，就关闭（除非正在新建链接的过程中）
            if (editor.isActive("link")) {
                // 读取当前链接的内容
                const previousUrl = editor.getAttributes("link").href;
                if (previousUrl !== linkHref) {
                    setLinkHref(previousUrl);
                }
            } else {
                // 如果当前选区没有文字，且不在 link 上，关闭面板
                if (editor.state.selection.empty && isLinkPanelOpen) {
                    setIsLinkPanelOpen(false);
                }
            }
        },
    });

    // 独立处理保存链接的逻辑
    const saveLink = () => {
        if (!editor || !linkHref) return;

        // 恢复编辑器焦点，扩展当前的链接范围（如果是修改现有链接）
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: linkHref })
            .insertContent(linkText) // 替换或插入文字
            .run();

        setIsLinkPanelOpen(false);
    };

    const removeLink = () => {
        if (!editor) return;
        editor.chain().focus().unsetLink().run();
        setIsLinkPanelOpen(false);
    };

    return (
        <>
            {editor && (
                <BubbleMenu editor={editor}>
                    {isLinkPanelOpen ? (
                        <div
                            ref={panelRef}
                            className="bg-white rounded-xl shadow-[0_12px_40px_rgba(33,24,14,0.12)] border border-black/5 p-4 w-[320px] flex flex-col gap-4"
                            onClick={(e) => e.stopPropagation()} // 阻止冒泡防止点击由于其它机制导致面板关闭
                        >
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-[#9b8f80] px-1">
                                    页面或 URL
                                </label>
                                <div className="flex items-center bg-[#fdfaf5] border border-black/5 rounded-lg px-3 py-2 focus-within:border-[#dec9a0] focus-within:bg-white transition-colors">
                                    <LinkIcon size={14} className="text-[#a89d90] shrink-0 mr-2" />
                                    <input
                                        type="text"
                                        value={linkHref}
                                        onChange={(e) => setLinkHref(e.target.value)}
                                        placeholder="https:// 或搜索内容..."
                                        className="bg-transparent border-none outline-none text-sm text-[#2d261f] w-full placeholder:text-[#c7b9a5]"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-[#9b8f80] px-1">
                                    链接标题
                                </label>
                                <div className="flex items-center bg-[#fdfaf5] border border-black/5 rounded-lg px-3 py-2 focus-within:border-[#dec9a0] focus-within:bg-white transition-colors">
                                    <input
                                        type="text"
                                        value={linkText}
                                        onChange={(e) => setLinkText(e.target.value)}
                                        placeholder="输入的显示文字"
                                        className="bg-transparent border-none outline-none text-sm text-[#2d261f] w-full placeholder:text-[#c7b9a5]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-black/5 mt-1">
                                <button
                                    onClick={removeLink}
                                    className="flex items-center gap-1.5 text-[12px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-md transition-colors"
                                >
                                    <Trash2 size={13} />
                                    移除链接
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsLinkPanelOpen(false)}
                                        className="text-[12px] font-medium text-[#8a8074] hover:bg-black/5 px-3 py-1.5 rounded-md transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={saveLink}
                                        className="text-[12px] font-bold text-white bg-[#1f1d1a] hover:bg-[#3a342e] px-3 py-1.5 rounded-md shadow-sm transition-colors"
                                    >
                                        应用
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bubble-menu flex items-center bg-white border border-black/5 rounded-lg shadow-md p-1 gap-1">
                            {/* 基础工具栏 */}
                            <button
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${editor.isActive("bold") ? "bg-[#f3ead8] text-[#8a6a2f]" : "text-[#6b6258] hover:bg-[#fbf9f6]"}`}
                            >
                                <span className="font-bold text-[14px]">B</span>
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${editor.isActive("italic") ? "bg-[#f3ead8] text-[#8a6a2f]" : "text-[#6b6258] hover:bg-[#fbf9f6]"}`}
                            >
                                <span className="italic text-[14px]">I</span>
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${editor.isActive("strike") ? "bg-[#f3ead8] text-[#8a6a2f]" : "text-[#6b6258] hover:bg-[#fbf9f6]"}`}
                            >
                                <span className="line-through text-[14px]">S</span>
                            </button>
                            <div className="w-px h-4 bg-black/10 mx-1" /> {/* 分隔线 */}
                            <button
                                onClick={() => {
                                    // 开启链接编辑面板，并获取当前选中的文字作为预期标题
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
                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${editor.isActive("link") || isLinkPanelOpen ? "bg-[#f3ead8] text-[#8a6a2f]" : "text-[#6b6258] hover:bg-[#fbf9f6]"}`}
                            >
                                <LinkIcon size={14} />
                            </button>
                            {editor.isActive("link") && (
                                <>
                                    <div className="w-px h-4 bg-black/10 mx-1" />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                editor.getAttributes("link").href,
                                            );
                                        }}
                                        className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-[#6b6258] hover:bg-[#fbf9f6] transition-colors"
                                        title="复制链接"
                                    >
                                        <Copy size={13} />
                                    </button>
                                    <a
                                        href={editor.getAttributes("link").href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-[#6b6258] hover:bg-[#fbf9f6] transition-colors"
                                        title="访问链接"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </>
                            )}
                        </div>
                    )}
                </BubbleMenu>
            )}
            <EditorContent editor={editor} />
        </>
    );
};
