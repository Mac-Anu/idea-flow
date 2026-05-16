import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CHAT_CONFIG } from "@/config/chat";
import type { Message } from "../types";
import { agentFrontendApi } from "@/api/agent";

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

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;
        
        const userMsg = inputValue.trim();
        setInputValue("");
        
        const newMessages = [...messages, { role: "user", content: userMsg } as Message];
        setMessages(newMessages);
        setIsLoading(true);

        const payloadMessages = [...newMessages];
        
        try {
            if (pathname === "/") {
                payloadMessages.unshift({
                    role: "system",
                    content: CHAT_CONFIG.PROMPTS.HOME_GUIDE
                });
            } else if (pathname.startsWith("/blog/") || pathname.startsWith("/articles/")) {
                const articleElement = document.querySelector("article") || document.querySelector("main");
                const articleText = articleElement 
                    ? articleElement.innerText.slice(0, CHAT_CONFIG.MAX_CONTEXT_LENGTH) 
                    : "未找到文章内容";
                
                payloadMessages.unshift({
                    role: "system",
                    content: `${CHAT_CONFIG.PROMPTS.ARTICLE_ASSISTANT}\n\n【文章内容开始】\n${articleText}\n【文章内容结束】`
                });
            } else {
                payloadMessages.unshift({ role: "system", content: CHAT_CONFIG.PROMPTS.DEFAULT });
            }

            // 3. 调用强类型的 Hono RPC API
            const response = await agentFrontendApi.chat({ messages: payloadMessages });

            if (!response.ok) throw new Error("API 请求失败");
            
            const data = await response.json();
            
            if (data?.data?.response) {
                let aiResponse = String(data.data.response);
                
                // 正则匹配提取 <UPDATE_EDITOR> 标签内容
                const editorMatch = aiResponse.match(/<UPDATE_EDITOR>([\s\S]*?)<\/UPDATE_EDITOR>/);
                if (editorMatch) {
                    const newContent = editorMatch[1].trim();
                    // 触发全局事件通知编辑器更新
                    window.dispatchEvent(new CustomEvent('ai-edit-article', { detail: { content: newContent } }));
                    
                    // 从展示给用户的消息中移除这部分 Markdown
                    aiResponse = aiResponse.replace(/<UPDATE_EDITOR>[\s\S]*?<\/UPDATE_EDITOR>/, "").trim();
                    if (!aiResponse) {
                        aiResponse = "✅ 我已经根据你的要求更新了文章内容，请在左侧编辑器中查看效果！";
                    }
                }

                setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "网络开小差了，请稍后再试 😢" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isOpen,
        setIsOpen,
        inputValue,
        setInputValue,
        messages,
        isLoading,
        messagesEndRef,
        handleSend
    };
};
