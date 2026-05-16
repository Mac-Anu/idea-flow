export type ChatRole = "user" | "assistant" | "system";

export type Message = {
    role: ChatRole;
    content: string;
};

// 预留以后如果加入函数调用等高级特性的类型定义
export type ToolCall = {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
};
