# 1. 使用官方 Node 基础镜像（Alpine 版本体积更小）
FROM node:20-alpine AS builder

WORKDIR /app

# 启用 pnpm (固定版本，防止 GitHub Actions 环境版本不一致导致安装失败)
RUN npm install -g pnpm@10.33.2

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

RUN npm install -g pnpm@10.33.2

# 6. 从 builder 阶段把构建好的产物和依赖拷过来
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 6b. 拷贝数据库迁移 + 回填所需的源码（容器启动时自动同步表结构、回填分块向量）
#     drizzle-kit / tsx 已在 node_modules 里。回填脚本依赖 src/server 与 scripts。
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/scripts ./scripts

# 7. 暴露应用运行的端口
EXPOSE 3000

# 8. 启动命令（每步幂等，按序执行）：
#    ① pnpm dbp        同步表结构（新增表/列，纯增量）；服务器 ideaflow 为独立库，push 安全
#    ② backfill 脚本    给「尚无 chunk」的文章回填分块向量（已回填的跳过，故重启多次安全）
#    ③ pnpm start      启动应用
#    前两步用 `||` 兜底：迁移/回填偶发失败只告警，不阻断应用启动，避免整站起不来。
CMD ["sh", "-c", "pnpm dbp || echo '[warn] drizzle push 失败，跳过迁移'; pnpm tsx scripts/backfill-embeddings.ts || echo '[warn] 回填失败，跳过'; pnpm start"]