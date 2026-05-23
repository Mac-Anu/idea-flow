import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tools } from "./tools";

/**
 * @fileoverview LangGraph 反思工作流 (Self-Reflection Agent)
 * 
 * 核心引擎模块：使用 StateGraph 实现的一个循环评估智能体。
 * 该工作流包含一个生成节点 (Generator) 和一个审查节点 (Critic)，
 * 通过循环迭代，确保最终生成的输出满足预定的质量标准。
 */

/**
 * 初始化大语言模型客户端
 * 采用兼容 OpenAI 的标准接口，默认指向 DeepSeek 终端。
 */
export const llm = new ChatOpenAI({
    modelName: "deepseek-chat", // 使用深度求索模型
    apiKey: process.env.DEEPSEEK_API_KEY, // 这里用 apiKey
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1",
    },
});

/**
 * 工作流状态机定义
 * 采用官方预设的 MessagesAnnotation 结构，用于在节点流转期间持久化上下文对话历史。
 */
const graphState = MessagesAnnotation;


/**
 * 生成器节点 (Generator Node)
 * 核心执行单元：负责生成初稿响应，或根据审查节点的反馈建议进行多轮重写。
 * 
 * @param state - 当前工作流状态容器，包含从图启动以来的所有消息流转历史
 * @returns 包含新消息的局部状态对象，底层机制将自动将其追加至全局状态数组中
 */
async function generateNode(state: typeof MessagesAnnotation.State) {
    const llmWithTools = llm.bindTools(tools);
    const response = await llmWithTools.invoke(state.messages);
    return { messages: [response] }; // 返回的新消息会自动拼接到历史记录中
}

/**
 * 审查器节点 (Critic Node / Self-Reflection)
 * 核心评估单元：提取生成节点的最新输出，基于系统内置的严格评价基准进行质量检测（如幻觉、逻辑漏洞等）。
 * 
 * @param state - 当前工作流状态容器
 * @returns 包含审查结论的消息对象
 */
async function reflectNode(state: typeof MessagesAnnotation.State) {
    
    // 提取全局状态数组中的最后一条消息（即前置生成节点输出的待审内容）
    const lastMessage = state.messages[state.messages.length - 1];
    
    const criticPrompt = `You are a strict reviewer. Please check the following response for spelling errors, logical flaws, or unnecessary verbosity.
If there are issues, point them out directly for revision.
If the response is perfect, reply with exactly "PERFECT" and nothing else.

Content to review:
${lastMessage.content}`;
    
    const review = await llm.invoke([{ role: "user", content: criticPrompt }]);
    return { messages: [review] };
}


/**
 * 路由 1: 生成器之后的判定
 * 判断是调用工具，还是进入审查器 (Critic)
 */
function shouldToolOrReflect(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    
    // 如果模型决定调用工具，则路由到工具节点
    if (lastMessage.additional_kwargs?.tool_calls?.length || (lastMessage as any).tool_calls?.length) {
        return "tools";
    }
    
    // 否则，生成完毕，进入反思审查环节
    return "reflect";
}

/**
 * 路由 2: 审查器之后的判定
 * 判断是审查通过 (PERFECT) 结束流程，还是打回重写 (generate)
 */
function shouldEndOrGenerate(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const lastMessageContent = lastMessage.content as string;
    
    // 若审查评价中包含 "PERFECT" 关键字，则放行输出，流程终止
    if (lastMessageContent.includes("PERFECT")) {
        return "end";
    }
    // 否则驳回，重新流转至生成器节点进行修订
    return "generate";
}

/**
 * 编译构建 LangGraph 业务流
 * 完成图节点的注册、连接，并绑定起止节点及条件动态路由机制。
 */
const workflow = new StateGraph(graphState)
    .addNode("generate", generateNode)
    .addNode("reflect", reflectNode)
    .addNode("tools", new ToolNode(tools))
    .addEdge("__start__", "generate")
    .addConditionalEdges("generate", shouldToolOrReflect, {
        tools: "tools",
        reflect: "reflect"
    })
    .addConditionalEdges("reflect", shouldEndOrGenerate, {
        end: "__end__",
        generate: "generate"
    })
    .addEdge("tools", "generate");

/**
 * 已编译完成的反思智能体实例
 * 可直接供路由层调用 (e.g. reflectionAgent.invoke(...))
 */
export const reflectionAgent = workflow.compile();

/**
 * 🚀 【后端调用示例】 (你可以把它写在 route.ts 里)
 * 
 * import { reflectionAgent } from './agent';
 * 
 * const result = await reflectionAgent.invoke({
 *    messages: [{ role: "user", content: "请用一句话解释什么是 Vibe Coding？" }]
 * });
 * 
 * console.log(result.messages); // 里面包含了生成、被骂、修改的全部内心戏记录！
 */
