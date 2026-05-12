# 🐳 Docker 全栈项目通用部署指南

这份指南为你梳理了从零开始在一台干净的 Linux 服务器上，使用 Docker 和 Docker Compose 部署现代全栈（如 Next.js / Node.js + PostgreSQL + Redis + Meilisearch）项目的标准流程。

---

## 1. 准备工作：安装 Docker 环境

在一台全新的 Ubuntu/Debian 服务器上，你需要先安装 Docker 和 Docker Compose。

```bash
# 1. 更新软件包列表
sudo apt update

# 2. 安装 Docker
sudo apt install docker.io -y

# 3. 安装 Docker Compose (V2 现代版)
sudo apt install docker-compose-plugin -y

# 4. 将当前用户加入 docker 组（这样以后运行 docker 就不每次都需要敲 sudo 了）
sudo usermod -aG docker $USER

# （注意：执行完第4步后，建议退出终端重新 SSH 登录一下，让权限生效）
```

---

## 2. 编写 Dockerfile（构建应用镜像）

在你的项目根目录下，新建一个名为 `Dockerfile` 的文件。这是一个将你的 Node.js 代码打包成标准镜像的“菜谱”。

以下是一个标准的 Next.js/Node.js 通用 `Dockerfile`：

```dockerfile
# 1. 使用官方 Node 基础镜像（Alpine 版本体积更小）
FROM node:20-alpine AS builder

# 2. 设置工作目录
WORKDIR /app

# 3. 开启 corepack（自带 pnpm/yarn 支持）
RUN corepack enable

# 4. 拷贝依赖描述文件，先安装依赖（利用 Docker 缓存加速构建）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 5. 拷贝所有源代码并执行构建
COPY . .
RUN pnpm build

# 6. 生成运行时的极简镜像（减少服务器体积占用）
FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

# 7. 从 builder 阶段把构建好的产物拷过来
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 8. 暴露应用运行的端口
EXPOSE 3000

# 9. 启动命令
CMD ["pnpm", "start"]
```

---

## 3. 编写 docker-compose.yml（编排多容器）

光有应用还不够，我们还需要数据库、缓存和搜索引擎。在项目根目录下新建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # 1. 你的主应用 Web 容器
  web:
    build: .                         # 告诉 docker 用当前目录的 Dockerfile 构建镜像
    container_name: my_app_web
    restart: unless-stopped          # 服务器重启或崩溃时自动拉起
    ports:
      - "3000:3000"                  # 暴露 3000 端口给外网
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:mysecretpassword@db:5432/mydb
      - REDIS_URL=redis://redis:6379
      - MEILISEARCH_HOST=http://meilisearch:7700
      - MEILISEARCH_ADMIN_KEY=your_meili_master_key
    depends_on:                      # 确保依赖项先启动
      - db
      - redis
      - meilisearch

  # 2. PostgreSQL 数据库
  db:
    image: postgres:15-alpine
    container_name: my_app_db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=mysecretpassword
      - POSTGRES_DB=mydb
    ports:
      - "5432:5432"                  # 如果你不需要外部客户端连接，可以删掉这行更安全
    volumes:
      - pgdata:/var/lib/postgresql/data  # 挂载数据卷，防止数据丢失

  # 3. Redis 缓存
  redis:
    image: redis:alpine
    container_name: my_app_redis
    restart: unless-stopped
    volumes:
      - redisdata:/data              # 挂载数据卷，持久化缓存

  # 4. Meilisearch 搜索引擎
  meilisearch:
    image: getmeili/meilisearch:v1.8
    container_name: my_app_meilisearch
    restart: unless-stopped
    environment:
      - MEILI_ENV=production
      - MEILI_MASTER_KEY=your_meili_master_key
    ports:
      - "7700:7700"
    volumes:
      - meilidata:/meili_data        # 挂载数据卷，持久化搜索索引

# 声明在文件末尾的所有数据卷（极其重要，否则容器一旦销毁数据就全没了）
volumes:
  pgdata:
  redisdata:
  meilidata:
```

---

## 4. 部署与运维日常命令

把包含上述代码的项目上传到服务器后，进入项目根目录，日常操作只需要记住以下几个命令：

### 🚀 一键构建并启动服务
```bash
# -d 表示在后台运行（daemon），这样你退出终端服务器依然在跑
docker compose up -d --build
```

### 🛑 停止服务
```bash
# 停止运行的容器，但不会删除数据卷
docker compose down
```

### 👀 查看运行日志（排错必备）
```bash
# 持续跟踪所有容器的日志
docker compose logs -f

# 只看你的主应用抛出的日志
docker compose logs -f web

# 只看数据库日志
docker compose logs -f db
```

### 🧹 清理空间
如果你改了很多次代码，构建了很多次镜像，服务器硬盘可能会被占满。
```bash
# 清理所有未使用的数据、镜像和容器（加 -a 会连没用的基础镜像一起删了）
docker system prune -a
```

---

## 💡 核心避坑指南

1. **内网通信法则**：在 `docker-compose.yml` 中，容器之间直接使用 `服务名` 作为域名互相访问！比如 Node.js 连数据库的 host 填 `db`，不要填 `localhost`。
2. **数据卷隔离**：永远记得为需要保存数据的服务（PostgreSQL/MySQL/Redis/Meilisearch）配置 `volumes`。
3. **安全隐患**：千万不要把真实的 `docker-compose.yml` 里的密码和环境变量提交到 Git！你应该提交一个 `docker-compose.yml` 并使用 `.env` 文件配合变量 `${DATABASE_URL}` 读取。
