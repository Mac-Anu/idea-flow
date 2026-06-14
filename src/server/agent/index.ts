import { StateGraph, MessagesAnnotation, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tools } from "./tools";
import { AIMessage } from "@langchain/core/messages";
import { reviewSchema } from "./schema";

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
 * 自定义工作流状态
 * 在官方 messages 历史之外,额外增加 passed 字段,
 * 用于让审查节点(reflect)把结构化的"是否通过"结论显式存进状态,
 * 路由函数直接读取该布尔值,替代脆弱的字符串匹配。
 */
const ReflectionState = Annotation.Root({
    ...MessagesAnnotation.spec,
    passed: Annotation<boolean>(),
    iterations: Annotation<number>(),
});

/**
 * 生成器节点 (Generator Node)
 * 核心执行单元：负责生成初稿响应，或根据审查节点的反馈建议进行多轮重写。
 *
 * @param state - 当前工作流状态容器，包含从图启动以来的所有消息流转历史
 * @returns 包含新消息的局部状态对象，底层机制将自动将其追加至全局状态数组中
 */
async function generateNode(state: typeof ReflectionState.State) {
    const llmWithTools = llm.bindTools(tools);
    const response = await llmWithTools.invoke(state.messages);
    return { messages: [response], iterations: (state.iterations ?? 0) + 1 }; // 返回的新消息会自动拼接到历史记录中
}

/**
 * 审查器节点 (Critic Node / Self-Reflection)
 * 核心评估单元：提取生成节点的最新输出，基于系统内置的严格评价基准进行质量检测（如幻觉、逻辑漏洞等）。
 *
 * @param state - 当前工作流状态容器
 * @returns 包含审查结论的消息对象
 */
async function reflectNode(state: typeof ReflectionState.State) {
    // 提取全局状态数组中的最后一条消息（即前置生成节点输出的待审内容）
    const lastMessage = state.messages[state.messages.length - 1];

    // 让审查模型按 reviewSchema 返回结构化结论,而非自由文字
    const criticLlm = llm.withStructuredOutput(reviewSchema);

    const review = await criticLlm.invoke([
        {
            role: "system",
            content: `你是一名严格的审查员。请检查回答是否存在错别字、逻辑漏洞或不必要的冗长,并
            判断它是否合格通过。`,
        },
        {
            role: "user",
            content: `待审查的内容:\n${lastMessage.content}`,
        },
    ]);

    // review 现在是 { passed: boolean, reason: string }
    return {
        messages: [{ role: "user", content: `审查意见: ${review.reason}` }],
        passed: review.passed,
    };
}

/**
 * 路由 1: 生成器之后的判定
 * 判断是调用工具，还是进入审查器 (Critic)
 */
function shouldToolOrReflect(state: typeof ReflectionState.State) {
    const lastMessage = state.messages[state.messages.length - 1];

    // 如果模型决定调用工具，则路由到工具节点
    if (AIMessage.isInstance(lastMessage) && lastMessage.tool_calls?.length) {
        return "tools";
    }

    // 否则，生成完毕，进入反思审查环节
    return "reflect";
}

/**
 * 路由 2: 审查器之后的判定
 * 读取审查节点写入状态的结构化结论 passed,通过则结束,否则打回重写
 */
function shouldEndOrGenerate(state: typeof ReflectionState.State) {
    if (state.passed) return "end";
    if (state.iterations >= 3) return "end";
    return "generate";
}

/**
 * 编译构建 LangGraph 业务流
 * 完成图节点的注册、连接，并绑定起止节点及条件动态路由机制。
 */
const workflow = new StateGraph(ReflectionState)
    .addNode("generate", generateNode)
    .addNode("reflect", reflectNode)
    .addNode("tools", new ToolNode(tools))
    .addEdge("__start__", "generate")
    .addConditionalEdges("generate", shouldToolOrReflect, {
        tools: "tools",
        reflect: "reflect",
    })
    .addConditionalEdges("reflect", shouldEndOrGenerate, {
        end: "__end__",
        generate: "generate",
    })
    .addEdge("tools", "generate");

/**
 * 已编译完成的反思智能体实例
 * 可直接供路由层调用 (e.g. reflectionAgent.invoke(...))
 */
export const reflectionAgent = workflow.compile();
