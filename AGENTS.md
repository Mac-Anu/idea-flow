# AGENTS — AI 编程代理快速入门指南

**目的**：为 AI 编程代理提供简洁、可执行的指令，使其在本仓库快速上手并高效工作。

## 代理入手清单（优先执行）
- 阅读 `README.md` 和 `.env.example`（项目根），理解必需的服务和环境变量。
- 查看 `src/server/*` 和 `src/app` 了解后端和前端的位置。
- 在修改运行时逻辑前，在本地开发环境运行引导步骤（见下方"本地开发与基础设施"）。

## 整体架构（快速理解）
- **前端**：Next.js (App Router) 在 `src/app` — UI、页面和 Tiptap 编辑器都在这里。
- **后端**：两层架构
  - `src/api/*` 中的 Next API 和客户端辅助函数，用于前端到服务器的调用（薄包装）。
  - `src/server/*` 下的独立 Hono 服务器，暴露内部 API 和 OpenAPI 文档。`src/server/main.ts` 连接路由，`createHonoApp()` 在 `src/server/common/app.ts` 中定义。
- **持久化与基础设施**：Postgres（Drizzle ORM）、Redis（限流、队列）、Meilisearch（搜索）。Docker Compose 供本地开发使用。
- **AI 堆栈**：LangGraph / LangChain 集成在 `src/server/agent/*` 下。LLM 调用使用 `llm.invoke` / `llm.stream` 和 reflectionAgent 工作流。

## 关键文件与示例（作为事实来源）
- `package.json` — 常用开发脚本：`pnpm install`、`pnpm run dev`、`pnpm dbp`（drizzle-kit push）、`pnpm dbg`（generate）、`pnpm dbo`（studio）、`pnpm test`（vitest）。
- 开发引导：`README.md` + `.env.example` — 复制到 `.env` 并填入密钥（DATABASE_URL、REDIS_URL、MEILISEARCH_API_KEY、DEEPSEEK_API_KEY）。
- 本地基础设施：`docker-compose.yml` — postgres、redis、meilisearch。使用 `docker compose up -d`。
- Hono 应用工厂：`src/server/common/app.ts` — 含 `createHonoApp()`、`serverIncs` 和 `beforeServer()`（初始化 redis、队列、meilisearch 索引）。调用顺序很重要：初始化在服务前进行。
- Agent HTTP 接口：`src/server/agent/route.ts` — 端点包括 `/chat`、`/chat/stream`（SSE）、`/explain`、`/editor`。关键模式：Redis 限流、缓存（ai:explain:<md5>）、返回最终答案和内部推理历史。
- 前端 agent 客户端：`src/api/agent.ts` 和 `src/lib/hono.ts` — `buildClient()` + `fetchApi()` 展示前端调用 Hono 服务器的方法（使用 appConfig.apiPath + getBaseUrl()）。
- 提示词与行为：`src/config/chat.ts` — 系统提示、编辑器助手使用的特殊 XML 标签（例如 <UPDATE_TITLE>、<UPDATE_TAGS>、<UPDATE_EDITOR>）。修改内容的代理必须只发出这些确切标签以触发前端更新。

## 项目特有约定（不要假设常见默认值）
- **认证**：`AuthProtectedMiddleware` 在 `src/server/*` 中广泛应用以保护写入/管理路由。修改 API 前总是检查中间件是否存在。
- **API 路径抽象**：`appConfig.apiPath`（来自 `src/config/app.ts`）和 `getBaseUrl()`（来自 `src/lib/app.ts`）到处使用 — 用 `buildClient()` 构造客户端 URL 以避免源不匹配。
- **限流和缓存键**：Redis 键遵循 `ai:ratelimit:<type>:<userOrIp>` 和 `ai:explain:<md5>` 模式。添加端点时遵循这些命名规范。
- **SSE 行为**：`/agent/chat/stream` 使用 SSE 并对 token 块进行 JSON 编码。客户端期望 `event: token` 帧带有 JSON 字符串数据和 `done` 事件。
- **数据库工作流**：Drizzle 命令映射到 npm 脚本（见 `package.json`）— 用 `pnpm dbp` 推送 schema；不要假设迁移自动运行。

## 开发者工作流与命令（可直接复制粘贴）
- 安装依赖：`pnpm install`
- 启动基础设施：`docker compose up -d`
- 拷贝环境文件：`cp .env.example .env` 并填入密钥（MEILISEARCH_API_KEY 必须与 docker-compose 匹配）。
- 推送数据库 schema：`pnpm dbp`（drizzle-kit push）
- 开发服务器：`pnpm run dev`（Next 开发服务器 + 内部 Hono 路由通过导入连接）
- 测试：`pnpm test`（vitest），监视模式：`pnpm test:watch`
- 代码检查：`pnpm run lint`（eslint）

## 集成与调试说明
- Meilisearch 初始化在 `beforeServer()` 中是可选的/失败软关闭；检查 `meilisearch.log` 和控制台日志获取初始化消息。
- Hono 暴露的 OpenAPI / 文档端点：`/api/openapi`、`/api/swagger`、`/api/docs` — 用于检查请求/响应合约。
- 调试 AI 成本/滥用问题：查看 `src/server/agent/route.ts` 中的 Redis 限流键和日志（代码增加 `ai:ratelimit:*`）。
- 通过从监听 `token` 事件的客户端访问 `/api/agent/chat/stream` 检查 SSE 流；token 是 JSON 编码的字符串。

## 安全扩展方式（自动化代理的规则）
- 永远不要在不检查 `AuthProtectedMiddleware` 用法的情况下修改受认证保护的端点。添加新的写入端点时，应用相同的中间件。
- 遵循现有 Redis 键模式以进行限流和缓存。
- 编辑更新编辑器内容的 agent 提示或输出时，保持 `src/config/chat.ts` 中确切的 XML 标签合约（前端解析依赖它们）。
- 修改服务器路由时倾向于添加 OpenAPI 注解（hono-openapi `describeRoute`）以保持文档准确。

## 遇到问题时先看这些
- 运行时初始化：`src/server/common/app.ts` 和 `src/server/main.ts`
- AI 逻辑：`src/server/agent/index.ts`、`src/server/agent/route.ts`、`src/server/agent/schema.ts`
- 前端集成：`src/api/agent.ts`、`src/lib/hono.ts`、`src/config/chat.ts`、`src/app/...`（Tiptap 编辑器组件在 `src/components/article` 下）

## 修改运行时行为后的最小验证序列
1. 启动基础设施：`docker compose up -d`
2. 启动开发：`pnpm run dev`
3. 打开 `http://localhost:3000` 和 `http://localhost:3000/api/swagger` 确认 API 和文档加载。
4. 从 UI 触发 AI 端点（例如阅读页面中的解释），监视服务器控制台的 Redis 键增量和 Meili 日志。

---

**完成** — 本文件包含代理所需的最具可执行性、最易发现的模式。遇到具体示例和保守编辑边界时可参考列出的文件。

