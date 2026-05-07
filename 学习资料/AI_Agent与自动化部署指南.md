# 🤖 AI Agent 与自动化工作流全栈架构指南

在全栈开发中，引入 AI 能力主要分为两种主流架构形态。理解这两者的差异并结合使用，是资深架构师的核心竞争力。

---

## 🏗️ 架构形态一：作为独立的微服务平台 (以 n8n 为例)

这种形态下，AI 引擎和自动化平台是作为一个**独立运行的软件系统**部署在服务器上的。你也可以把它理解成一个黑盒微服务。常见的例子有：**n8n、Dify、Flowise、LangServe** 等。

### 📌 部署方式
通常使用 **Docker Compose** 在云服务器上独立部署。

1. 在服务器上创建一个目录并编写 `docker-compose.yml` 文件：
```yaml
version: '3.8'

volumes:
  n8n_data:

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://n8n.yourdomain.com/
      - GENERIC_TIMEZONE=Asia/Shanghai
    volumes:
      - n8n_data:/home/node/.n8n
```

2. 启动并在服务器后台常驻：
```bash
docker compose up -d
```

### 🔒 安全与通信策略（核心考点）
前端 **绝对不能** 直接调用 n8n 的 Webhook（会导致 API 裸奔）。
正确的全栈交互链路：
`用户界面 -> Next.js / Hono 后端 -> n8n Webhook -> Hono 后端接收结果`
- **内部鉴权**：n8n 要往你的 Hono 数据库写数据时，不走常规的用户 Session，而是通过在 Header 中携带 **内部微服务密钥 (Internal Secret Key)**。你的 Hono 路由通过比对密钥来判断这个请求是真实的 n8n 发出的，还是黑客伪造的。

---

## 🧬 架构形态二：作为应用内嵌引擎 (以 LangGraph.js 为例)

这种形态下，AI 逻辑**寄生在你自己的 Node.js/TypeScript 代码库**中，是你的后端代码的一部分。它能直接操作你的数据库和状态，毫无延迟。

### 📌 部署方式
不需要在服务器上额外部署软件，它是作为**代码依赖包**安装在你的项目中。

1. **本地开发安装依赖**：
```bash
pnpm add @langchain/core @langchain/langgraph @langchain/openai
```

2. **配置大模型 API 密钥** (在项目根目录 `.env` 文件中)：
```env
# 国内推荐 DeepSeek，性价比极高，且完全兼容 OpenAI 的 SDK
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxx"
OPENAI_BASE_URL="https://api.deepseek.com/v1"
```

3. **随后端服务自动启动**：部署上线时，它会随着你的 Next.js 或 Hono 项目被打包，并在 Node.js 服务器中原生运行。

### 🔄 自反思状态机 (Self-Reflection Agent) 原理与代码

下面是一段标准的带“自我审查”的图节点核心代码架构：

```typescript
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// 1. 初始化模型
const llm = new ChatOpenAI({
    modelName: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY, // 注意最新版参数名是 apiKey
    configuration: { baseURL: process.env.OPENAI_BASE_URL },
});

const graphState = MessagesAnnotation;

// 2. 节点 (Nodes)：干活的打工人
async function generateNode(state: typeof MessagesAnnotation.State) {
    const response = await llm.invoke(state.messages);
    return { messages: [response] }; // 新消息自动追加到历史
}

// 3. 节点 (Nodes)：严厉的审查主管
async function reflectNode(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const criticPrompt = `审查以下内容，有问题直接指出。如果完美，请只回复 "PERFECT"。\n\n${lastMessage.content}`;
    const review = await llm.invoke([{ role: "user", content: criticPrompt }]);
    return { messages: [review] };
}

// 4. 路由逻辑 (Edges)：决定走向
function shouldContinue(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1].content as string;
    if (lastMessage.includes("PERFECT")) return "end"; // 过关
    return "generate"; // 驳回重做
}

// 5. 组装成图
const workflow = new StateGraph(graphState)
    .addNode("generate", generateNode)
    .addNode("reflect", reflectNode)
    .addEdge("__start__", "generate")
    .addEdge("generate", "reflect")
    .addConditionalEdges("reflect", shouldContinue, {
        end: "__end__",
        generate: "generate"
    });

export const reflectionAgent = workflow.compile();
```

### 💡 关键代码闭坑指南

1. **版本参数更新坑**：`@langchain/openai` 的最新版里，传递秘钥的参数已经由老版本的 `openAIApiKey` 废弃并修改为了 **`apiKey`**。
2. **模块提升导致的加载时机坑**：
   在独立的 Node.js 测试脚本（如 `test.ts`）中，引入 `dotenv/config` 会遇到模块提升（Hoisting）的顺序问题。如果你写成静态 import，`agent` 的初始化会早于环境变量的加载，从而报 `Missing credentials` 错误。

**正确的测试脚本写法（使用动态 import 阻塞流程）**：
```typescript
// test/ai.ts
import "dotenv/config"; // 强行放在第一行

async function run() {
    // 【关键代码】必须使用 await import 动态加载
    // 确保 dotenv 把 .env 读入内存后，再去初始化包含大模型的逻辑
    const { reflectionAgent } = await import("../server/agent/index");
    
    // ... 后面再执行 invoke
    const result = await reflectionAgent.invoke({
        messages: [{ role: "user", content: "什么是 Vibe Coding？" }]
    });
}
```

---

## 🎯 总结
- **n8n** 擅长：定时抓取全网文章、翻译、跨软件同步等**重型胶水自动化任务**。
- **LangGraph.js** 擅长：在产品内部（如对话框、写作助手）实现低延迟、高逻辑复杂度的**自我审查 AI 大脑**。
- 两者结合使用，即构成了**现代顶级全栈 AI Native 应用的基础设施。**
