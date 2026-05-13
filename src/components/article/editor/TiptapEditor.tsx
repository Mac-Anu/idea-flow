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
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import "./TiptapEditor.css";
import { useState, useRef, useEffect } from "react";
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
function CodeBlockView({ node, updateAttributes, editor }: any) {
    const language = node.attrs.language || "javascript";

    return (
        <NodeViewWrapper className="code-block-wrapper">
            {editor?.isEditable && (
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
            )}
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

// 搜索高亮 ProseMirror 插件 Key
const searchHighlightPluginKey = new PluginKey("searchHighlight");

/**
 * 创建搜索高亮 Tiptap 扩展
 * 基于 ProseMirror Decoration API，在文档中找到所有匹配关键词的位置，
 * 用 CSS class 装饰它们，并自动滚动到第一个匹配位置
 */
const createSearchHighlightExtension = () => {
    return Extension.create({
        name: "searchHighlight",

        addProseMirrorPlugins() {
            return [
                new Plugin({
                    key: searchHighlightPluginKey,
                    state: {
                        init() {
                            return { keyword: "", decorations: DecorationSet.empty };
                        },
                        apply(tr, prev, _oldState, newState) {
                            const meta = tr.getMeta(searchHighlightPluginKey);
                            if (meta !== undefined) {
                                if (!meta.keyword) {
                                    return { keyword: "", decorations: DecorationSet.empty };
                                }
                                
                                const decorations: Decoration[] = [];
                                
                                // 清理关键词：去除所有空格、标点、符号，只保留纯文本内容
                                const keywordClean = meta.keyword.replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
                                if (!keywordClean) {
                                    return { keyword: meta.keyword, decorations: DecorationSet.empty };
                                }

                                // 构建全文无标点字符串，以及它每个字符对应的 ProseMirror 位置
                                let strippedText = "";
                                const mapping: number[] = [];

                                newState.doc.descendants((node, pos) => {
                                    if (node.isText && node.text) {
                                        for (let i = 0; i < node.text.length; i++) {
                                            const char = node.text[i];
                                            // 只保留非空白、非标点的字符
                                            if (!/[\s\p{P}\p{S}]/u.test(char)) {
                                                strippedText += char.toLowerCase();
                                                mapping.push(pos + i);
                                            }
                                        }
                                    }
                                });

                                // 查找并高亮
                                let matchIndex = strippedText.indexOf(keywordClean);
                                while (matchIndex !== -1) {
                                    let currentStart = mapping[matchIndex];
                                    let currentEnd = currentStart + 1;

                                    // 将连续的字符聚合成一个 decoration 区间，如果遇到不连续（跨 block 或跨 mark），则切断
                                    for (let i = 1; i < keywordClean.length; i++) {
                                        const nextPos = mapping[matchIndex + i];
                                        if (nextPos === currentEnd) {
                                            currentEnd++; // 连续
                                        } else {
                                            decorations.push(
                                                Decoration.inline(currentStart, currentEnd, {
                                                    class: "search-highlight-match",
                                                })
                                            );
                                            currentStart = nextPos;
                                            currentEnd = nextPos + 1;
                                        }
                                    }
                                    decorations.push(
                                        Decoration.inline(currentStart, currentEnd, {
                                            class: "search-highlight-match",
                                        })
                                    );
                                    
                                    matchIndex = strippedText.indexOf(keywordClean, matchIndex + 1);
                                }

                                return {
                                    keyword: meta.keyword,
                                    decorations: DecorationSet.create(newState.doc, decorations),
                                };
                            }
                            // 文档变化时映射 decorations
                            if (tr.docChanged && prev.keyword) {
                                return {
                                    keyword: prev.keyword,
                                    decorations: prev.decorations.map(tr.mapping, tr.doc),
                                };
                            }
                            return prev;
                        },
                    },
                    props: {
                        decorations(state) {
                            return this.getState(state)?.decorations ?? DecorationSet.empty;
                        },
                    },
                }),
            ];
        },
    });
};

export const TiptapEditor = ({
    content,
    onChange,
    onHeadingsChange,
    onEditorReady,
    highlight,
    readOnly = false,
}: {
    content: string;
    onChange?: (value: string) => void;
    onHeadingsChange?: (headings: Heading[]) => void;
    onEditorReady?: (editor: Editor) => void;
    highlight?: string;
    readOnly?: boolean;
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
            createSearchHighlightExtension() as any,
        ],
        content: content,
        editable: !readOnly,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
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

    useEffect(() => {
        if (!editor || !highlight) return;

        // 设置高亮词
        const tr = editor.state.tr.setMeta(searchHighlightPluginKey, { keyword: highlight });
        editor.view.dispatch(tr);

        // 尝试滚动到第一个匹配项
        setTimeout(() => {
            const firstMatch = document.querySelector(".search-highlight-match");
            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 100);

        // 6 秒后自动清除高亮，或者当用户开始输入时（通过插件内的逻辑清除，但这里提供一个显式超时清除）
        const timeoutId = setTimeout(() => {
            if (!editor.isDestroyed) {
                const clearTr = editor.state.tr.setMeta(searchHighlightPluginKey, { keyword: "" });
                editor.view.dispatch(clearTr);
            }
        }, 6000);

        return () => clearTimeout(timeoutId);
    }, [editor, highlight]);

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
                    ) : (
                        <div className="bubble-menu flex items-center bg-popover text-popover-foreground border border-border rounded-lg shadow-md p-1 gap-1">
                            {/* 基础工具栏 */}
                            <button
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${editor.isActive("bold") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
                            >
                                <span className="font-bold text-[14px]">B</span>
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${editor.isActive("italic") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
                            >
                                <span className="italic text-[14px]">I</span>
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${editor.isActive("strike") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
                            >
                                <span className="line-through text-[14px]">S</span>
                            </button>
                            <div className="w-px h-4 bg-border mx-1" /> {/* 分隔线 */}
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
                                className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${editor.isActive("link") || isLinkPanelOpen ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
                            >
                                <LinkIcon size={14} />
                            </button>
                            {editor.isActive("link") && (
                                <>
                                    <div className="w-px h-4 bg-border mx-1" />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                editor.getAttributes("link").href,
                                            );
                                        }}
                                        className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors"
                                        title="复制链接"
                                    >
                                        <Copy size={13} />
                                    </button>
                                    <a
                                        href={editor.getAttributes("link").href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors"
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
