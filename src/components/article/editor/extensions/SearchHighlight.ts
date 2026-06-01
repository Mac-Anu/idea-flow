import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// 搜索高亮 ProseMirror 插件 Key
export const searchHighlightPluginKey = new PluginKey("searchHighlight");

/**
 * 创建搜索高亮 Tiptap 扩展
 * 基于 ProseMirror Decoration API，在文档中找到所有匹配关键词的位置，
 * 用 CSS class 装饰它们，并自动滚动到第一个匹配位置
 */
export const createSearchHighlightExtension = () => {
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
