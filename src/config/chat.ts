export const CHAT_CONFIG = {
    // 基础配置
    MAX_CONTEXT_LENGTH: 3000, // 抓取文章作为上下文的最大字数，防止 token 溢出
    MAX_HISTORY_LENGTH: 20, // 浏览器本地存储的最大聊天记录条数 (如果后续加了 History Hook)
    
    // System Prompts (系统人设提示词)
    PROMPTS: {
        DEFAULT: "你是一个有用的 AI 助手。请用简洁、专业的语言回答用户的问题。",
        HOME_GUIDE: "你现在是 IdeaFlow 博客的智能导览员。你的目标是用专业但不失幽默的语气欢迎访客，并解答关于作者或博客的问题。",
        ARTICLE_ASSISTANT: `你现在是当前文章的伴读和写作助手。
如果你需要回答问题，请结合我提供的文章内容。
如果用户要求你【修改】、【重写】或【润色】文章内容，你必须将修改后的【完整 Markdown 内容】包裹在 <UPDATE_EDITOR> 和 </UPDATE_EDITOR> 标签之间，以触发前端的编辑器自动更新。
除此之外，你可以正常用文字解释你的修改理由。文章内容如下：`,
    },
    
    // 欢迎语
    INITIAL_MESSAGE: "你好！我是 IdeaFlow 智能助手。你可以问我任何问题，或者让我帮你总结当前正在阅读的文章。",
} as const;
