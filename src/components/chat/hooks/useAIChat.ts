import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CHAT_CONFIG } from "@/config/chat";
import type { Message } from "../types";
import { agentFrontendApi } from "@/api/agent";
import { getBaseUrl } from "@/lib/app";
import { appConfig } from "@/config/app";

export const useAIChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: CHAT_CONFIG.INITIAL_MESSAGE }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const pathname = usePathname();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // 编辑器页（/articles/）才有「让 AI 改写文章」的能力（监听 ai-edit-article 事件），
    // 这条链路依赖整段解析 <UPDATE_*> 标签，不适合流式，走老的非流式接口；
    // 其余页面（首页、/blog/ 阅读页）一律走流式接口，逐字输出。
    const isEditorPage = pathname.startsWith("/articles/");

    // 根据当前页面构建带 system prompt 的完整消息列表
    const buildPayload = (history: Message[]): Message[] => {
        const payload = [...history];
        if (pathname === "/") {
            payload.unshift({ role: "system", content: CHAT_CONFIG.PROMPTS.HOME_GUIDE });
        } else if (pathname.startsWith("/blog/") || pathname.startsWith("/articles/")) {
            const articleElement = document.querySelector("article") || document.querySelector("main");
            const articleText = articleElement
                ? articleElement.innerText.slice(0, CHAT_CONFIG.MAX_CONTEXT_LENGTH)
                : "未找到文章内容";
            payload.unshift({
                role: "system",
                content: `${CHAT_CONFIG.PROMPTS.ARTICLE_ASSISTANT}\n\n【文章内容开始】\n${articleText}\n【文章内容结束】`
            });
        } else {
            payload.unshift({ role: "system", content: CHAT_CONFIG.PROMPTS.DEFAULT });
        }
        return payload;
    };

    // 非流式（编辑器页）：走反思工作流，整段返回后解析 <UPDATE_*> 触发编辑器更新
    const sendNonStreaming = async (payloadMessages: Message[]) => {
        const response = await agentFrontendApi.chat({ messages: payloadMessages });
        if (!response.ok) throw new Error("API 请求失败");

        const data = await response.json();
        if (data?.data?.response) {
            let aiResponse = String(data.data.response);

            const titleMatch = aiResponse.match(/<UPDATE_TITLE>([\s\S]*?)<\/UPDATE_TITLE>/);
            const tagsMatch = aiResponse.match(/<UPDATE_TAGS>([\s\S]*?)<\/UPDATE_TAGS>/);
            const editorMatch = aiResponse.match(/<UPDATE_EDITOR>([\s\S]*?)<\/UPDATE_EDITOR>/);

            if (titleMatch || tagsMatch || editorMatch) {
                const newTitle = titleMatch ? titleMatch[1].trim() : undefined;
                const newTags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : undefined;
                const newContent = editorMatch ? editorMatch[1].trim() : undefined;

                window.dispatchEvent(new CustomEvent('ai-edit-article', {
                    detail: { title: newTitle, tags: newTags, content: newContent }
                }));

                aiResponse = aiResponse.replace(/<UPDATE_TITLE>[\s\S]*?<\/UPDATE_TITLE>/, "");
                aiResponse = aiResponse.replace(/<UPDATE_TAGS>[\s\S]*?<\/UPDATE_TAGS>/, "");
                aiResponse = aiResponse.replace(/<UPDATE_EDITOR>[\s\S]*?<\/UPDATE_EDITOR>/, "").trim();

                if (!aiResponse) {
                    aiResponse = "✅ 我已经根据你的要求更新了文章信息，请在左侧查看效果！";
                }
            }

            setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
        }
    };

    // 流式（其余页面）：用 fetch 读取 SSE 流，逐 token 追加到最后一条 assistant 消息
    const sendStreaming = async (payloadMessages: Message[]) => {
        const url = `${getBaseUrl()}${appConfig.apiPath}/agent/chat/stream`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // 带上鉴权 cookie
            body: JSON.stringify({ messages: payloadMessages }),
        });

        if (!response.ok || !response.body) {
            // 限流等错误此时是普通 JSON 响应
            let msg = "AI 生成失败，请稍后再试";
            try {
                const data = await response.json();
                if (data?.message) msg = data.message;
            } catch { /* 忽略解析失败 */ }
            throw new Error(msg);
        }

        // 先插入一条空的 assistant 消息，后续把 token 不断追加进去
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // 把累积的文本写回到「最后一条」assistant 消息
        const appendToLast = (text: string) => {
            setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                    next[next.length - 1] = { ...last, content: last.content + text };
                }
                return next;
            });
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE 以「\n\n」分隔事件，逐个完整事件处理，残缺的留在 buffer 里等下一块
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? ""; // 最后一段可能不完整，留着

            for (const evt of events) {
                if (!evt.trim()) continue;

                let eventType = "message";
                const dataLines: string[] = [];
                for (const line of evt.split("\n")) {
                    if (line.startsWith("event:")) {
                        eventType = line.slice(6).trim();
                    } else if (line.startsWith("data:")) {
                        dataLines.push(line.slice(5).trimStart());
                    }
                }
                const dataStr = dataLines.join("\n");

                if (eventType === "token") {
                    try {
                        appendToLast(JSON.parse(dataStr)); // 后端用 JSON 编码过，这里还原
                    } catch {
                        appendToLast(dataStr);
                    }
                    // 首个 token 到达即关闭"三点加载"动画（幂等，重复调用无副作用）
                    setIsLoading(false);
                } else if (eventType === "error") {
                    throw new Error(dataStr);
                }
                // "done" 事件无需处理，循环会自然结束
            }
        }
    };

    const handleSend = async (overrideText?: string) => {
        // overrideText 来自快捷按钮；没有则取输入框的值
        const userMsg = (overrideText ?? inputValue).trim();
        if (!userMsg || isLoading) return;

        // 只有走输入框时才清空输入框
        if (overrideText === undefined) setInputValue("");

        const newMessages = [...messages, { role: "user", content: userMsg } as Message];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const payloadMessages = buildPayload(newMessages);
            if (isEditorPage) {
                await sendNonStreaming(payloadMessages);
            } else {
                await sendStreaming(payloadMessages);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            const msg = error instanceof Error && error.message ? error.message : "网络开小差了，请稍后再试 😢";
            setMessages(prev => {
                // 若流式已插入空 assistant 消息，把错误写进去；否则新增一条
                const last = prev[prev.length - 1];
                if (last && last.role === "assistant" && last.content === "") {
                    const next = [...prev];
                    next[next.length - 1] = { role: "assistant", content: msg };
                    return next;
                }
                return [...prev, { role: "assistant", content: msg }];
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 根据当前页面决定展示哪组快捷提问
    const quickPrompts =
        pathname.startsWith("/blog/") || pathname.startsWith("/articles/")
            ? CHAT_CONFIG.QUICK_PROMPTS.ARTICLE
            : CHAT_CONFIG.QUICK_PROMPTS.DEFAULT;

    return {
        isOpen,
        setIsOpen,
        inputValue,
        setInputValue,
        messages,
        isLoading,
        messagesEndRef,
        handleSend,
        quickPrompts
    };
};
