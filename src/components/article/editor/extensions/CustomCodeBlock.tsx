import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { NodeViewProps } from "@tiptap/core";
import { useState, useEffect } from "react";
import mermaid from "mermaid";

export const LANGUAGES = [
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
    { value: "mermaid", label: "Mermaid / 图表" },
];

export function CodeBlockView({ node, updateAttributes, editor }: NodeViewProps) {
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

export const CustomCodeBlock = CodeBlockLowlight.extend({
    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
    },
});
