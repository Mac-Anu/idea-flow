# IdeaFlow

IdeaFlow 是我个人开发并使用的一套基于 Next.js 15 App Router 构建的现代知识管理系统。
区别于传统的静态博客，它深度集成了 LangGraph 智能体流与自动化工作流，旨在探索 AI 如何真正介入并增强个人的阅读与写作体验。

## 特性

- **AI 智能体交互**: 基于 LangGraph 构建的反思型 Agent。支持在富文本编辑器中划词唤起解释、翻译及润色，并自动生成文章导读 (TL;DR)。
- **全栈类型安全**: 基于 TypeScript 构建，后端使用 Drizzle/Prisma + Postgres。
- **全文检索**: 抛弃传统模糊匹配，自建 Meilisearch 引擎实现极速且支持纠错的全文搜索。
- **现代化编辑器**: 深度定制的 Tiptap Headless 编辑器，支持 Markdown 语法与 `/` 快捷指令。
- **身份认证与权限**: 采用 Better-Auth，API 路由级鉴权，杜绝接口滥用与盗刷。
- **自动化工作流**: 预留 Webhook 接口，与 n8n 等自动化平台无缝打通。

---

## 🛠️ 技术栈 (Tech Stack)

| 领域 | 核心技术选型 |
| --- | --- |
| **前端架构** | Next.js (App Router), React, TypeScript |
| **样式与组件** | Tailwind CSS, Lucide Icons, Glassmorphism UI |
| **后端 API** | Next.js API Routes, Hono (Edge-compatible) |
| **数据库** | PostgreSQL (Drizzle/Prisma), Redis |
| **搜索引擎** | Meilisearch |
| **身份鉴权** | Better-Auth |
| **编辑器** | Tiptap (Headless Rich Text), Markdown |
| **AI 模型接入** | LangChain / LangGraph, DeepSeek API / OpenAI 兼容接口 |

---

## 🚀 快速启动 (Getting Started)

### 1. 环境准备
确保您的本地已安装以下环境：
- Node.js >= 18.x
- pnpm >= 8.x
- Docker (用于快速启动数据库和搜索引擎)

### 2. 克隆项目
```bash
git clone https://github.com/YourUsername/idea-flow.git
cd idea-flow
```

### 3. 安装依赖
```bash
pnpm install
```

### 4. 环境变量配置
复制一份环境配置文件并填入您自己的配置（包括数据库连接、AI API Key 和 Meilisearch 密钥）：
```bash
cp .env.example .env
```
> **注意**：请务必配置 `MEILISEARCH_API_KEY` 以及在 `src/server/agent/index.ts` 中配置相应的 AI 服务 Token 以体验完整功能。

### 5. 启动开发服务器
```bash
# 启动前端页面
pnpm run dev

# 如果您本地有 Meilisearch 实例，请确保它正在运行：
# ./meilisearch --master-key="YOUR_MASTER_KEY"
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可预览。

---

## 🛡️ 安全性与部署 (Security & Deployment)

本项目内置了生产级别的安全防护机制：
- AI 接口已接入严格的**登录鉴权保护 (AuthProtectedMiddleware)**，拒绝一切未授权脚本的 Token 盗刷。
- 推荐使用 Vercel 或自建 Linux 服务器配合 Docker 进行全自动化部署 (配合 GitHub Actions)。

---

## 协议与合作

本项目目前作为个人实践项目持续迭代中。代码暂开源供学习交流使用。

如果您对该架构感兴趣，或有企业级 AI 知识库搭建、自动化工作流改造等商业定制需求，欢迎联系交流：
- Email: your.email@example.com
- Wechat/闲鱼: [占位符]
