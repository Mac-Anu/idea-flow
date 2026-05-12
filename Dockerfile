# 1. 使用官方 Node 基础镜像（Alpine 版本体积更小）
FROM node:20-alpine AS builder

WORKDIR /app

# 启用 pnpm
RUN corepack enable

# 2. 拷贝包管理文件 (如果你的项目是 monorepo，有 workspace.yaml 也会一并拷入)
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# 3. 安装依赖（使用 --frozen-lockfile 保证版本绝对一致）
RUN pnpm install --frozen-lockfile

# 4. 拷贝所有源代码并执行构建
COPY . .
RUN pnpm build

# 5. 生成运行时的极简镜像（减少镜像体积）
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable

# 6. 从 builder 阶段把构建好的产物和依赖拷过来
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 7. 暴露应用运行的端口
EXPOSE 3000

# 8. 启动命令
CMD ["pnpm", "start"]