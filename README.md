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
git clone https://github.com/Mac-Anu/idea-flow.git
cd idea-flow
```

### 3. 安装依赖
```bash
pnpm install
```

### 4. 一键启动依赖服务
项目依赖 PostgreSQL、Redis 和 Meilisearch，已提供 `docker-compose.yml` 一键拉起：
```bash
docker compose up -d
```

### 5. 环境变量配置
复制环境配置模板并按需填写（数据库连接、AI API Key、Meilisearch 密钥等）：
```bash
cp .env.example .env
```
> 默认值已对齐 `docker-compose.yml`，本地开箱即用。如需完整体验 AI 能力，请填入兼容 OpenAI 规范的 `DEEPSEEK_API_KEY`，并确保 `.env` 中的 `MEILISEARCH_API_KEY` 与 compose 里的 `MEILI_MASTER_KEY` 一致。

### 6. 初始化数据库与启动
```bash
# 推送数据库 schema
pnpm dbp

# 启动开发服务器
pnpm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可预览。

---

## 🛡️ 安全性与部署 (Security & Deployment)

本项目内置了生产级别的安全防护机制：
- AI 接口已接入严格的**登录鉴权保护 (AuthProtectedMiddleware)**，拒绝一切未授权脚本的 Token 盗刷。
- 推荐使用 Vercel 或自建 Linux 服务器配合 Docker 进行全自动化部署 (配合 GitHub Actions)。

---

## 协议与合作

本项目作为个人实践项目持续迭代中，代码开源供学习交流使用。更多作品见 [GitHub @Mac-Anu](https://github.com/Mac-Anu)。
