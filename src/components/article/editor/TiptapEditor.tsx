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
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Extension, NodeViewProps } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import "./TiptapEditor.css";
import { useState, useRef, useEffect } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Link as LinkIcon, Copy, Trash2, ExternalLink, ImagePlus, Sparkles, Search, BookOpen, Wand2, PenLine } from "lucide-react";
import mermaid from "mermaid";

const lowlight = createLowlight(common);
mermaid.initialize({ 
    startOnLoad: false, 
    theme: "default",
    fontFamily: "inherit",
    // @ts-ignore - 强制忽略类型报错，使用真实的原生尺寸而非被容器强行压缩
    useMaxWidth: false,
    themeVariables: {
        fontSize: "15px",
    },
    gantt: {
        fontSize: 14,
        sectionFontSize: 14,
        barHeight: 30, // 增加横条高度
        leftPadding: 100, // 增加左侧留白防止文字被截断
        // @ts-ignore
        useWidth: 1200, // 强制甘特图最小宽度，防止被挤压
    }
});

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
function CodeBlockView({ node, updateAttributes, editor }: NodeViewProps) {
    const language = node.attrs.language || "javascript";
    const code = node.textContent;
    const [svgContent, setSvgContent] = useState<string>("");
    const [isMermaidError, setIsMermaidError] = useState(false);

    useEffect(() => {
        if (language === "mermaid" && code.trim()) {
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            mermaid
                .render(id, code)
                .then((result) => {
                    setSvgContent(result.svg);
                    setIsMermaidError(false);
                })
                .catch((e) => {
                    console.error("Mermaid render error", e);
                    setIsMermaidError(true);
                });
        }
    }, [language, code]);

    return (
        <NodeViewWrapper className="code-block-wrapper relative">
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
            
            {language === "mermaid" ? (
                <div className="mermaid-preview-container flex flex-col gap-4">
                    {editor?.isEditable && (
                        <pre data-language={language} className="m-0 border border-border/50">
                            {/* @ts-ignore */}
                            <NodeViewContent as="code" />
                        </pre>
                    )}
                    <div className="mermaid-preview bg-white rounded-lg p-6 overflow-x-auto shadow-sm my-2 text-slate-800" contentEditable={false}>
                        {svgContent && !isMermaidError ? (
                            <div className="min-w-max flex justify-center" dangerouslySetInnerHTML={{ __html: svgContent }} />
                        ) : isMermaidError ? (
                            <div className="text-destructive text-sm p-4 border border-destructive/20 rounded-md">图表语法错误，无法渲染</div>
                        ) : (
                            <div className="text-muted-foreground text-sm">渲染中...</div>
                        )}
                    </div>
                </div>
            ) : (
                <pre data-language={language}>
                    {/* @ts-ignore */}
                    <NodeViewContent as="code" />
                </pre>
            )}
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
    onExtractTitle,
    highlight,
    readOnly = false,
}: {
    content: string;
    onChange?: (value: string) => void;
    onHeadingsChange?: (headings: Heading[]) => void;
    onEditorReady?: (editor: Editor) => void;
    onExtractTitle?: (title: string) => void;
    highlight?: string;
    readOnly?: boolean;
}) => {
    const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
    const [linkHref, setLinkHref] = useState("");
    const [linkText, setLinkText] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);

    // 我们需要一个 ref 来防止面板内的点击事件让编辑器失去焦点
    const panelRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // 图片上传核心函数
    const uploadImage = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "图片上传失败");
                return null;
            }
            const { url } = await res.json();
            return url;
        } catch {
            alert("图片上传失败，请检查网络");
            return null;
        }
    };

    // 插入图片到编辑器
    const insertImage = async (file: File) => {
        if (!editor) return;
        setIsUploadingImage(true);
        const url = await uploadImage(file);
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
        setIsUploadingImage(false);
    };

    // 工具栏点击上传图片
    const handleImageUploadClick = () => {
        imageInputRef.current?.click();
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await insertImage(file);
        // 清空 input 以允许再次选择同一文件
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

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
        editorProps: {
            handlePaste: (view, event, slice) => {
                // 处理粘贴图片文件（如截图粘贴）
                const items = event.clipboardData?.items;
                if (items) {
                    for (const item of Array.from(items)) {
                        if (item.type.startsWith("image/")) {
                            const file = item.getAsFile();
                            if (file) {
                                insertImage(file);
                                return true; // 阻止默认粘贴行为
                            }
                        }
                    }
                }

                const firstNode = slice.content.firstChild;
                // 如果粘贴的内容是以标题开头，并且当前编辑器是空的（新文章），则自动提取为标题
                if (firstNode && firstNode.type.name === "heading") {
                    const isDocEmpty = view.state.doc.textContent.trim() === "";
                    if (isDocEmpty && onExtractTitle) {
                        onExtractTitle(firstNode.textContent);
                        // 让原生的粘贴操作先完成，然后在下一个事件循环中删掉刚刚贴进来的第一个标题
                        setTimeout(() => {
                            const { state, dispatch } = view;
                            const firstChild = state.doc.firstChild;
                            if (firstChild && firstChild.type.name === "heading") {
                                const tr = state.tr.deleteRange(0, firstChild.nodeSize);
                                dispatch(tr);
                            }
                        }, 0);
                    }
                }
                return false;
            },
            handleDrop: (view, event, _slice, moved) => {
                // 只处理外部拖入的文件，不处理编辑器内部的拖拽
                if (moved) return false;
                const files = event.dataTransfer?.files;
                if (files && files.length > 0) {
                    for (const file of Array.from(files)) {
                        if (file.type.startsWith("image/")) {
                            event.preventDefault();
                            insertImage(file);
                            return true;
                        }
                    }
                }
                return false;
            },
        },
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
            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: "rounded-lg max-w-full h-auto mx-auto my-4 shadow-sm",
                },
            }),
            createSearchHighlightExtension(),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
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
                if (editor.state.selection.empty && isAiMenuOpen) {
                    setIsAiMenuOpen(false);
                    setAiExplanation(null);
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

    const handleAiAction = async (action: "tldr" | "polish" | "continue" | "explain") => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, " ");
        if (!text && action !== "continue") {
            alert("请先选中一段文字");
            return;
        }

        setAiLoading(true);
        setAiExplanation(null);
        try {
            if (action === "explain") {
                const res = await fetch("/api/agent/explain", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text })
                });
                if (!res.ok) throw new Error("AI Request Failed");
                const data = await res.json();
                setAiExplanation(data.data.explanation);
                return;
            }

            const res = await fetch("/api/agent/editor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, action })
            });

            if (!res.ok) throw new Error("AI Request Failed");
            const data = await res.json();
            const result = data.data.result;

            editor.chain().focus().run();

            if (action === "polish") {
                editor.chain().focus().insertContentAt({ from, to }, result).run();
            } else if (action === "continue") {
                editor.chain().focus().insertContentAt(to, "\n\n" + result).run();
            } else if (action === "tldr") {
                editor.chain().focus().insertContentAt(from, `> **AI 导读**：\n> ${result}\n\n`).run();
            }
            setIsAiMenuOpen(false);
        } catch (error) {
            alert("AI 处理失败，请稍后重试");
            setIsAiMenuOpen(false);
        } finally {
            setAiLoading(false);
        }
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
                    ) : isAiMenuOpen ? (
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
                    ) : (
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
                    )}
                </BubbleMenu>
            )}
            <EditorContent editor={editor} />
            {/* 隐藏的图片文件选择器 */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleImageFileChange}
                className="hidden"
            />
        </>
    );
};
