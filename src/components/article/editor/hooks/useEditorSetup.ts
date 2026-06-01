import { useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import AutoJoiner from "tiptap-extension-auto-joiner";
import { useState, useRef, useEffect, RefObject } from "react";
import { SlashCommand, getSuggestionItems, renderItems } from "../slash-command/SlashCommand";
import { CustomCodeBlock } from "../extensions/CustomCodeBlock";
import { createSearchHighlightExtension, searchHighlightPluginKey } from "../extensions/SearchHighlight";

const lowlight = createLowlight(common);

export interface Heading {
    level: number;
    text: string;
    pos: number;
}

export interface UseEditorSetupProps {
    content: string;
    onChange?: (value: string) => void;
    onHeadingsChange?: (headings: Heading[]) => void;
    onEditorReady?: (editor: Editor) => void;
    onExtractTitle?: (title: string) => void;
    highlight?: string;
    readOnly?: boolean;
}

export function useEditorSetup({
    content,
    onChange,
    onHeadingsChange,
    onEditorReady,
    onExtractTitle,
    highlight,
    readOnly = false,
}: UseEditorSetupProps) {
    const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
    const [linkHref, setLinkHref] = useState("");
    const [linkText, setLinkText] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);

    const panelRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

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

    const insertImage = async (file: File) => {
        if (!editor) return;
        setIsUploadingImage(true);
        const url = await uploadImage(file);
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
        setIsUploadingImage(false);
    };

    const handleImageUploadClick = () => {
        imageInputRef.current?.click();
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
                const items = event.clipboardData?.items;
                if (items) {
                    for (const item of Array.from(items)) {
                        if (item.type.startsWith("image/")) {
                            const file = item.getAsFile();
                            if (file) {
                                insertImage(file);
                                return true;
                            }
                        }
                    }
                }

                const firstNode = slice.content.firstChild;
                if (firstNode && firstNode.type.name === "heading") {
                    const isDocEmpty = view.state.doc.textContent.trim() === "";
                    if (isDocEmpty && onExtractTitle) {
                        onExtractTitle(firstNode.textContent);
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
            SlashCommand.configure({
                suggestion: {
                    items: getSuggestionItems,
                    render: renderItems,
                },
            }),
            createSearchHighlightExtension(),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            GlobalDragHandle.configure({
                dragHandleSelector: ".custom-drag-handle",
                dragHandleWidth: 72,
                scrollTreshold: 100,
            }),
            AutoJoiner,
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
            if (editor.isActive("link")) {
                const previousUrl = editor.getAttributes("link").href;
                if (previousUrl !== linkHref) {
                    setLinkHref(previousUrl);
                }
            } else {
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

        const tr = editor.state.tr.setMeta(searchHighlightPluginKey, { keyword: highlight });
        editor.view.dispatch(tr);

        setTimeout(() => {
            const firstMatch = document.querySelector(".search-highlight-match");
            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 100);

        const timeoutId = setTimeout(() => {
            if (!editor.isDestroyed) {
                const clearTr = editor.state.tr.setMeta(searchHighlightPluginKey, { keyword: "" });
                editor.view.dispatch(clearTr);
            }
        }, 6000);

        return () => clearTimeout(timeoutId);
    }, [editor, highlight]);

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

    return {
        editor,
        states: {
            isLinkPanelOpen,
            linkHref,
            linkText,
            isUploadingImage,
            isAiMenuOpen,
            aiLoading,
            aiExplanation,
        },
        actions: {
            setIsLinkPanelOpen,
            setLinkHref,
            setLinkText,
            setIsAiMenuOpen,
            setAiExplanation,
            handleAiAction,
            handleImageUploadClick,
            insertImage,
        },
        refs: {
            panelRef,
            imageInputRef,
        },
    };
}
