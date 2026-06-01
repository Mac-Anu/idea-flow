"use client";
import { EditorContent } from "@tiptap/react";
import "./TiptapEditor.css";
import { EditorBubbleMenu } from "./ui/EditorBubbleMenu";
import { DragHandle } from "./ui/DragHandle";
import { useEditorSetup, Heading } from "./hooks/useEditorSetup";

export interface TiptapEditorProps {
    content: string;
    onChange?: (value: string) => void;
    onHeadingsChange?: (headings: Heading[]) => void;
    onEditorReady?: (editor: any) => void;
    onExtractTitle?: (title: string) => void;
    highlight?: string;
    readOnly?: boolean;
}

export const TiptapEditor = (props: TiptapEditorProps) => {
    const { editor, states, actions, refs } = useEditorSetup(props);

    if (!editor) return null;

    return (
        <>
            <EditorBubbleMenu editor={editor} states={states} actions={actions} refs={refs} />
            <EditorContent editor={editor} className="tiptap-wrapper group/editor" />
            
            {/* 隐藏的图片文件选择器 */}
            <input
                ref={refs.imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await actions.insertImage(file);
                    if (refs.imageInputRef.current) refs.imageInputRef.current.value = "";
                }}
                className="hidden"
            />
            
            {/* 自定义拖拽手柄，高仿 Notion */}
            <DragHandle editor={editor} />
        </>
    );
};
