# 🧠 IdeaFlow - AI-Native Knowledge Management System

![IdeaFlow Banner](https://via.placeholder.com/1200x300/000000/FFFFFF?text=IdeaFlow+-+AI+Native+Blog+%26+Knowledge+Base)

> **IdeaFlow** 是一个面向超级个体和内容创作者的**「AI 原生知识管理与沉淀系统」**。它不仅仅是一个博客，更是您大脑的外部数字延伸。集成了极其深度的 AI 能力、企业级搜索引擎以及自动化的工作流生态。

## ✨ 核心亮点 (Key Features)

- 🤖 **深度 AI 赋能 (AI-Native)**
  - **划词解释与润色**：在阅读或编辑文章时，选中任意文本即可唤起 AI 进行深度解释、翻译或语法润色。
  - **LangGraph 反思智能体**：内置强大的多轮反思问答 Agent，确保生成的摘要和解答质量超越普通单次对话。
  - **智能摘要 (TL;DR)**：自动为长文章生成极其精准的核心导读卡片。
- ⚡ **极致的性能与搜索体验**
  - **Meilisearch 毫秒级检索**：超越传统 SQL 模糊查询，支持拼写纠错、高亮分词的沉浸式企业级搜索体验。
  - **Next.js 14/15 App Router**：完全基于最新的 React Server Components 架构，首屏加载极快，SEO 满分。
- 🎨 **现代化 UI/UX 设计**
  - 完美支持 **暗色/亮色 (Dark/Light) 双模无缝切换**。
  - **沉浸式阅读与写作**：左侧全局导航、右侧智能标签云联动、支持目录 (TOC) 跟随。
  - **Tiptap 富文本编辑器**：支持 Markdown 快捷输入、Mermaid 流程图解析与一键斜杠 `/` 命令唤出工具箱。
- 🔗 **全栈自动化生态**
  - 深度接入 **n8n Webhook** 自动化工作流。
  - 采用 **Better-Auth** 提供极其坚固的身份认证体系和路由级安全中间件防盗刷保护。

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

## 🤝 商业定制与外包接单 (Freelance & Customization)

本项目目前作为个人「超级个体」商业案例持续迭代中。
**提供基于本套架构的企业级定制开发服务（包括但不限于 AI 知识库搭建、全栈系统定制、自动化工作流改造等）。**

如果您对本项目感兴趣，或者有商业外包开发需求，欢迎联系：
- 📧 Email: your.email@example.com
- 💬 Wechat/闲鱼: [在这里留下您的微信号或闲鱼主页链接]

---
*Built with ❤️ and AI.*
