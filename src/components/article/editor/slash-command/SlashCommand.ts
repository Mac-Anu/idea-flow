import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { CommandList } from "./CommandList";

export const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: "一级标题",
            description: "最大字号标题",
            icon: "heading-1",
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
            },
        },
        {
            title: "二级标题",
            description: "中等字号标题",
            icon: "heading-2",
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
            },
        },
        {
            title: "三级标题",
            description: "普通字号标题",
            icon: "heading-3",
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
            },
        },
        {
            title: "代码块",
            description: "插入代码片段",
            icon: "code",
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setCodeBlock().run();
            },
        },
        {
            title: "表格",
            description: "插入基础表格",
            icon: "table",
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            },
        },
    ]
        .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10);
};

export const renderItems = () => {
    let component: ReactRenderer;
    let popup: any[];

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                zIndex: 9999,
                theme: "slash-menu"
            });
        },

        onUpdate(props: any) {
            component.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            popup[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },

        onKeyDown(props: any) {
            if (props.event.key === "Escape") {
                popup[0].hide();
                return true;
            }
            return (component.ref as any)?.onKeyDown(props);
        },

        onExit() {
            popup[0].destroy();
            component.destroy();
        },
    };
};

export const SlashCommand = Extension.create({
    name: "slashCommand",
    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});
