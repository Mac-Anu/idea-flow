# 🐧 Linux 从命令行到运维 (TS 全栈整合版)

> **目标**：把原来的 `01 生存级`、`02 部署级`、`03 运维级` 合并成一份从入门到上线、再到自动化与监控的完整学习资料。

## 学习路径

1. **生存级**：先会在 Linux 终端里高效操作，不慌。
2. **部署级**：把 Node.js / TS / Next.js 项目稳定跑起来。
3. **运维级**：让服务具备自动化、可观测、可恢复能力。

---

## 第一部分：生存级 - 命令行基础

> **目标**：不依赖图形界面，在黑色终端里存活下来，并高效完成文件与系统操作。

### 1. 📂 文件与目录操作 (进阶必备)

作为开发，你 90% 的时间都在用这些。要想显得专业，熟练掌握它们的高级参数（带杠的字母）非常重要。

#### `pwd` - 确认我在哪
- `pwd`: 打印当前绝对路径（Print Working Directory）。
  - **业界习惯**：SSH 登录进服务器后、执行任何危险删除操作前，先敲一次 `pwd` 确认路径，防止误操作。

#### `ls` - 看看有什么
- `ls`: 仅列出当前目录下的可见文件名。
- `ls -l`: 以长格式（列表）显示文件的权限、所有者、大小和修改时间。
- `ls -la`: **最常用**。列出所有文件，包括以点开头的隐藏文件（如 `.env`、`.git`）。
- `ls -lah`: **高级版**。在 `-la` 的基础上加上 `h` (human-readable)，把文件大小从字节变成可读的 K、M、G。
  - *例子*: `ls -lah /var/log` 查看日志目录，文件大小一目了然。

#### `cd` - 目录穿梭
- `cd /var/www`: 跳转到指定的绝对路径。
- `cd ~`: 瞬间回到当前用户的家目录（Home）。
- `cd ..`: 回退到上一级父目录。
- `cd -`: **效率神器**。回到你“上一次”所在的那个目录，适合在两个极远的目录间反复横跳。

#### `mkdir` - 建房子
- `mkdir my-app`: 在当前目录下建一个文件夹。
- `mkdir -p a/b/c`: **极其常用**。递归创建目录（Parents）。如果你要建 `a/b/c` 但 `a` 和 `b` 都不存在，不加 `-p` 会报错，加上则会顺藤摸瓜全部建好。

#### `rm` - 危险的删除操作
- `rm file.txt`: 删掉一个普通文件。
- `rm -r folder`: 递归删除（Recursive），用来删文件夹及其内部所有东西。
- `rm -f file.txt`: 强制删除（Force），即使文件只读也不会弹提示问你。
- `rm -rf node_modules/`: **核武器**。强制且递归地删除目录。由于它极度危险，**执行前务必再三确认路径**。千万不要手滑敲成 `rm -rf /`（这会把整个操作系统删光）。

#### `cp` & `mv` - 复制与搬家
- `cp .env.example .env`: 复制一个文件并重命名。
- `cp -r src/ src_backup/`: 递归复制（Recursive），用来备份整个文件夹。
- `cp -a src/ src_backup/`: **高级版备份**（Archive）。不仅复制内容，连原文件的修改时间、权限等属性也一并完美复刻。
- `mv old.ts new.ts`: 移动文件。如果在同目录下移动，本质上就是**重命名**。

#### `tar` - 压缩与解压
- `tar -czvf archive.tar.gz folder/`: **压缩**。将 folder 打包并压缩为 `.tar.gz`。
  - `-c` (create): 创建压缩包。
  - `-z` (gzip): 使用 gzip 算法压缩（体积更小）。
  - `-v` (verbose): 屏幕上显示压缩过程。
  - `-f` (file): 指定输出的文件名。
- `tar -xzvf archive.tar.gz`: **解压**。
  - `-x` (extract): 提取、解压。

#### `find` - 全盘精准搜索
- `find /var/www -name "*.log"`: 在 `/var/www` 下搜索所有以 `.log` 结尾的文件。
- `find . -type d -name "node_modules"`: 精确搜索当前目录（`.`）下的所有**文件夹**（`-type d`，d代表directory），名字叫 `node_modules`。

#### `less` & `tail` - 查看文件
- `less app.log`: 安全地分页查看大文件。按空格翻页，按 `q` 退出。
  - 为什么不用 `cat app.log`？因为如果日志有 10个G，`cat` 会瞬间把内存撑爆或者让终端刷屏卡死。
- `tail -n 50 app.log`: 查看文件最后 50 行内容。
- `tail -f app.log`: **排错神器**（Follow）。实时追踪文件的最新追加内容，非常适合盯着程序跑日志！按 `Ctrl+C` 退出。

#### `ln` - 创建快捷方式 (软链接)
- `ln -s /绝对路径/真实文件夹 /绝对路径/快捷方式名`: 创建软连接（Symbolic link）。
  - *例子*: `ln -s /opt/idea-flow /var/www/idea-flow`。这在 Nginx 部署和多版本管理中非常高频。

---

### 1.5 💻 系统监控 (运维必会)

遇到服务卡死、报错时，首先要排查是不是机器资源耗尽了。

#### `df` - 查硬盘空间
- `df -h`: 显示所有挂载磁盘的剩余空间（`-h` 代表 Human-readable）。
  - 如果 `/` (根目录) 的 Use% 达到 100%，你的所有数据库和程序都会崩溃。

#### `free` - 查内存
- `free -h` 或 `free -m`: 查看系统当前剩余内存（`-m` 以 MB 为单位）。

#### `top` / `htop` - 查 CPU 与系统负载
- `top`: 系统自带的资源监控面板。按 `q` 退出。
- `htop`: （需要通过 `apt install htop` 安装）。彩色的增强版 `top`，支持鼠标点击和树状视图，**强烈推荐**。

---

### 2. 🔗 管道与重定向

这是把多个命令串起来的核心能力，日志排错和部署时会高频使用。

#### `|` - 管道
- `ps aux | grep node`: 把前一个命令的输出，交给后一个命令继续处理。
- `pnpm list | less`: 输出太长时，接到分页器里看。

#### `>` 与 `>>` - 输出重定向
- `echo "hello" > demo.txt`: 覆盖写入文件。
- `echo "hello" >> demo.txt`: 追加写入文件。

#### `2>&1` - 合并错误输出
- `pnpm build > build.log 2>&1`: 把正常输出和错误输出都写进日志文件，方便排查。

---

### 3. 🔐 权限管理 (Permission)

代码跑不起来，一半是因为权限不对。

#### 理解 `drwxr-xr-x`
当你 `ls -la` 时，第一列就是权限。
- `r` (Read): 读。
- `w` (Write): 写。
- `x` (Execute): 执行；对文件夹来说是“能进入”。

#### `chmod` - 改权限
- `chmod +x script.sh`: 给脚本加执行权限。
- `chmod 755 script.sh`: 常见的脚本权限设置。
- `chmod 777 folder`: 虽然能解决问题，但通常不是好方案。

#### `chown` - 改主人
- `chown -R user:group folder`: 把文件夹及其子文件的所有者改成指定用户。

#### `sudo` - 超级管理员
- 当提示 `Permission denied` 时，先确认是不是权限问题，再决定要不要加 `sudo`。

---

### 4. 📝 文本编辑 (Vim 生存指南)

服务器上没有 VS Code 时，你至少要会改紧急配置。

#### 三种模式
1. **普通模式 (Normal)**：刚进去就是。按 `ESC` 回到这里。
2. **插入模式 (Insert)**：按 `i` 进入，可以开始输入。
3. **命令模式 (Command)**：普通模式下按 `:` 进入。

#### 生存连招
1. `vim config.json`：打开文件
2. 按 `i`：开始编辑
3. 按 `ESC`：退出编辑状态
4. 输入 `:wq`：保存并退出
5. 输入 `:q!`：不保存，强制退出

---

### 5. ⚙️ 系统与进程 (Process)

你的 Node 服务挂了吗？端口被占了吗？先查进程。

#### `ps` & `grep` - 找进程
- `ps aux | grep node`: 看看有没有 node 进程在跑。
- `ps aux | grep nginx`: 查 Nginx。

#### `kill` - 杀进程
- `kill <PID>`：正常结束。
- `kill -9 <PID>`：强制结束，只有卡死时再用。

#### `lsof` - 查端口
- `lsof -i :3000`: 看谁占用了 3000 端口。
- `lsof -i :5432`: 查数据库端口是不是被占。

---

### 6. 🌐 网络基础

#### `ping` - 通不通
- `ping google.com`: 看看服务器能不能出网。

#### `curl` - 模拟请求
- `curl http://localhost:3000`: 在服务器本机测试服务是不是活着。
- `curl -I https://my-site.com`: 只看响应头。
- `curl -X POST http://localhost:3000/api/login`: 模拟接口请求。

---

### 7. ⚡ 终端效率技巧

#### 自动补全与历史命令
- `Tab`: 自动补全文件名和命令。
- `↑ / ↓`: 翻历史命令。
- `history | grep ssh`: 从历史命令里搜索。
- `Ctrl + r`: 反向搜索历史命令，比上下箭头快得多。

#### 帮助文档
- `command --help`: 看命令参数。
- `man ls`: 看完整手册。

---

> **一句话理解这一层**
> 生存级不是“会背命令”，而是你知道**当前在哪、正在改什么、哪个进程在跑、请求有没有通**。只要这四件事能快速确认，你在 Linux 里就不会慌。

---

## 第二部分：部署级 - 服务与容器

> **目标**：把你在本地写好的 Node.js / TS 全栈应用，稳定地运行在 Linux 服务器上。

### 1. 🔑 远程连接 (SSH)

告别密码，使用密钥登录是最方便也最常见的标准做法。

#### 生成密钥 (Mac 本地)
```bash
ssh-keygen -t ed25519 -C "my-email@example.com"
# 一路回车，会在 ~/.ssh/ 下生成 id_ed25519 (私钥) 和 id_ed25519.pub (公钥)
```

#### 免密登录
把公钥内容追加到服务器的 `~/.ssh/authorized_keys`。
也可以直接用：

```bash
ssh-copy-id user@myserver_ip
```

#### SSH Config (偷懒神器)
在本地 `~/.ssh/config` 里写：

```text
Host myserver
  HostName 123.45.67.89
  User deploy
  IdentityFile ~/.ssh/id_ed25519
```

以后只要执行 `ssh myserver`。

#### 实战提醒
- 长期部署更推荐普通用户 + `sudo`，不要所有事情都直接用 `root`。
- 第一次连服务器时，先执行 `pwd`、`whoami`、`ls -la`，确认当前身份和目录。

---

### 2. 🧰 运行时环境准备

代码能不能跑起来，首先取决于服务器环境是不是对的。

#### 至少先确认这几个版本
```bash
node -v
npm -v
pnpm -v
```

#### 关键原则
- **Node 版本尽量和本地一致**，尤其是用到 Next.js、原生模块、构建工具时。
- 有 `pnpm-lock.yaml` 的项目，服务器安装依赖时优先使用：

```bash
pnpm install --frozen-lockfile
```

这样能保证和本地锁定的依赖一致，不会偷偷升级包版本。

---

### 3. 🚀 进程守卫 (PM2)

不要直接 `pnpm start` 然后把终端窗口关掉。要用进程管理器守护服务。

#### 常用命令
- `npm install -g pm2`: 全局安装 PM2。
- `pm2 start pnpm --name "my-web" -- start`: 用 `pnpm start` 启动服务。
- `pm2 list`: 查看所有服务状态。
- `pm2 logs my-web`: 实时查看日志。
- `pm2 restart my-web`: 重启服务。
- `pm2 delete my-web`: 删除服务。
- `pm2 monit`: 图形化查看 CPU / 内存。

#### 开机自启 (必做)
```bash
pm2 startup
pm2 save
```

服务器重启后，PM2 会把服务重新拉起来。

---

### 4. 📦 环境变量 (.env)

不要把数据库密码、JWT 密钥、第三方 API Key 硬编码进代码。

#### 常见做法
1. 在项目根目录放 `.env`。
2. 按环境拆分，例如 `.env.production`。
3. 或直接在系统层设置：

```bash
export DATABASE_URL="postgres://..."
export BETTER_AUTH_SECRET="..."
```

写入 `~/.bashrc` 或 `~/.zshrc` 后可以持久化。

#### 实战提醒
- `.env` 不要提交到 Git。
- 换服务器时，代码可以重新拉，但环境变量必须单独补。
- 启动失败时，先怀疑是不是漏了环境变量。

---

### 5. 🌐 Node / Next.js 上线流程

对 TS 全栈项目来说，真正上线通常就这几步。

#### 最小上线链路与极速跨服拷贝 (rsync / scp)
当你本地代码写完，打出了 `.next` 包，如何最快传到服务器上？

**方案 A：`scp` 暴力直传（适合偶发单次文件）**
最简单的拷贝命令，无脑覆盖：
```bash
# -r 代表递归拷贝整个文件夹
scp -r .next root@服务器IP:/var/www/idea-flow/
```
*(注意：多次使用 scp 覆盖 `.next` 会堆积大量历史垃圾文件，撑爆硬盘)*

**方案 B：`rsync` 企业级增量同步（强烈推荐）**
它会对比两边的差异，只传改过的文件，且能自动删除本地已经删掉的旧垃圾：
```bash
# -avz: 保留权限、显示进度、压缩流量
# --delete: 关键参数！删除服务器上多余的历史 chunk 文件
rsync -avz --delete .next/ root@服务器IP:/var/www/idea-flow/.next/

# 顺手把静态文件和包管理也带上：
rsync -avz public/ root@服务器IP:/var/www/idea-flow/public/
rsync -avz package.json pnpm-lock.yaml root@服务器IP:/var/www/idea-flow/
```

在服务器上接收完代码后，进行重启：
```bash
pnpm install --frozen-lockfile
pm2 restart idea-flow
```

#### 每一步在干什么
- `pnpm install --frozen-lockfile`: 严格按锁文件装依赖。
- `pnpm build`: 构建生产产物（例如 Next.js 的 `.next/`）。
- `pnpm start`: 启动生产服务，不是开发模式。

#### 启动后要立即验证
```bash
curl http://127.0.0.1:3000
curl -I http://127.0.0.1:3000
```

如果本机能通，再让 Nginx 把外部流量转进来。

---

### 6. 🛡️ 防火墙配置 (UFW)

服务器刚买来默认暴露在公网，防火墙是第一道基本防线。

#### 常用命令
- `ufw status`: 查看状态。
- `ufw allow 22/tcp`: 先放行 SSH。
- `ufw allow 80/tcp`: 放行 HTTP。
- `ufw allow 443/tcp`: 放行 HTTPS。
- `ufw enable`: 开启防火墙。
- `ufw reload`: 重载规则。

#### 实战提醒
开启前一定先放行 SSH，不然你会把自己锁在服务器外面。

---

### 7. 🐳 Docker 基础 (全栈必备)

Docker 的核心价值是：**让“我本地能跑”更容易变成“服务器也能跑”。**

#### 核心概念
- **Dockerfile**：构建规则。
- **Image (镜像)**：打包好的运行环境和代码。
- **Container (容器)**：镜像跑起来后的实例。

#### 适合 `pnpm` 项目的 Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
```

#### 常用命令
- `docker build -t my-app .`: 构建镜像。
- `docker run -d -p 80:3000 my-app`: 后台运行并映射端口。
- `docker ps`: 查看运行中的容器。
- `docker logs <container_id>`: 查看容器日志。
- `docker exec -it <container_id> sh`: 进入容器内部排查问题。

#### `.dockerignore` 也很重要
不要把无用文件一起打进镜像：

```text
node_modules
.next
.git
.env*
```

#### Docker Compose / `docker compose`
当项目不仅有 Node，还有 Redis、PostgreSQL 时，用编排工具管理会更轻松。

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

#### 常用命令
- `docker compose up -d`: 后台启动整套服务。
- `docker compose down`: 停止并销毁。
- `docker compose logs -f`: 实时看日志。

---

### 8. 🤔 什么时候用 PM2，什么时候用 Docker

#### PM2 更适合
- 单机部署
- 只有一个 Node 服务
- 你想快速上线，先跑起来再说

#### Docker 更适合
- 希望环境一致
- 不止一个服务（如 Web + DB + Redis）
- 想把部署做成可复制的标准流程

---

> **一句话理解这一层**
> 部署级的核心不是“把程序跑起来一次”，而是把它变成一个**可重复、可恢复、可迁移**的服务。

---

## 第三部分：运维级 - 自动化与监控

> **目标**：让服务器自己照顾自己（自动化），并在出问题前告诉你（监控）。

### 1. 📜 Shell 脚本 (.sh)

有些命令你每次部署都要重复：`git pull` → `pnpm install` → `pnpm build` → `pm2 restart`。这种操作就应该写成脚本。

#### 更稳的部署脚本 `deploy.sh`
```bash
#!/bin/bash
set -euo pipefail

APP_DIR=/var/www/my-web
cd "$APP_DIR"

echo "开始部署..."

# 1. 拉代码
git pull --ff-only origin main

# 2. 安装依赖
pnpm install --frozen-lockfile

# 3. 构建
pnpm build

# 4. 重启服务
pm2 restart my-web

# 5. 本机健康检查
curl -f http://127.0.0.1:3000 > /dev/null

echo "✅ 部署完成！"
```

记得给脚本执行权限：

```bash
chmod +x deploy.sh
./deploy.sh
```

#### 这三个选项很重要
- `set -e`: 任何一步失败，脚本立即停止。
- `set -u`: 使用未定义变量时直接报错。
- `set -o pipefail`: 管道中任意一步失败都算失败。

---

### 2. ⏰ 定时任务 (Cron)

适合做固定频率的后台工作，比如备份、清理缓存、定时巡检。

#### `crontab -e`
打开当前用户的定时任务编辑器。

#### 语法口诀
`* * * * * command`
分 时 日 月 周

#### 常见例子
- `0 2 * * * /root/backup.sh`: 每天凌晨 2 点备份。
- `*/5 * * * * curl -f http://127.0.0.1:3000/health`: 每 5 分钟探活一次。
- `0 3 * * 0 /root/cleanup.sh >> /var/log/cleanup.log 2>&1`: 每周日凌晨 3 点执行清理，并把日志写入文件。

[Crontab Guru](https://crontab.guru/) 可以帮你翻译 cron 表达式。

---

### 3. 🔍 日志分析 (Logs)

服务出问题时，不要靠猜，先看日志。

#### `tail`
- `tail -f app.log`: 实时盯日志。
- `tail -n 100 app.log`: 只看最后 100 行。

#### `grep`
- `grep "Error" app.log`: 在海量日志里只筛出错误。
- `grep -r "TODO" src/`: 在项目里递归搜索关键字。

#### `less`
- `less app.log`: 分页查看大日志文件。
- 在 `less` 中输入 `/timeout` 搜索，按 `n` 看下一个。

#### 常见日志位置
- `pm2 logs my-web`: 应用日志。
- `/var/log/nginx/access.log`: Nginx 访问日志。
- `/var/log/nginx/error.log`: Nginx 错误日志。
- `journalctl -u my-web.service -f`: Systemd 管理的服务日志。

---

### 4. 🛠️ 系统服务管理 (Systemd)

很多系统服务底层都由 Systemd 管理，包括 Nginx、Docker 以及你自己写的服务。

#### `systemctl`
- `systemctl status nginx`: 看服务是否正常运行。
- `systemctl restart nginx`: 重启服务。
- `systemctl enable nginx`: 设置开机自启。
- `systemctl stop nginx`: 停止服务。

#### `journalctl`
当服务压根起不来时，系统日志往往比业务日志更关键。
- `journalctl -u nginx.service -e`: 直接跳到最新日志。
- `journalctl -u my-web.service -f`: 持续跟踪某个服务的输出。

---

### 5. 🚦 Nginx (反向代理)

外部用户一般访问 `80/443`，真正的 Node 服务通常只监听 `3000`。Nginx 负责把两边接起来。

#### 核心配置示例与实战命令 (IdeaFlow 项目为例)

**1. 安装 Nginx**
```bash
sudo apt update
sudo apt install nginx -y
```

**2. 编写反向代理配置**
`sudo nano /etc/nginx/sites-available/ideaflow`
```nginx
server {
    listen 80;
    server_name _; # 如果有域名填域名，没有填 _ 代表接收所有IP访问

    # 1. 代理主业务 (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 2. 代理搜索引擎 (Meilisearch) - 选配
    location /search/ {
        proxy_pass http://127.0.0.1:7700;
    }
}
```

**3. 激活配置与重启**
```bash
# 删掉默认无关配置
sudo rm /etc/nginx/sites-enabled/default
# 创建软链接激活配置
sudo ln -s /etc/nginx/sites-available/ideaflow /etc/nginx/sites-enabled/
```

#### 改完配置后不要直接 reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

先测配置，再重载。这样能避免因为配置写错把站点打挂。

#### HTTPS (免费证书)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx
```

---

### 6. 📊 基础监控

服务器变慢，不一定是代码问题，也可能是 CPU、内存或磁盘顶满了。

#### `htop`
比 `top` 更直观：
- 看 CPU 每个核心的负载
- 看内存 / swap 使用情况
- 找异常进程并直接结束

#### `free -h`
- 看系统内存是否吃紧。

#### `df -h` & `du -sh`
- `df -h`: 看整个磁盘剩余空间。
- `du -sh logs`: 看某个目录到底占了多大。

#### `watch`
- `watch -n 2 "df -h && free -h"`: 每 2 秒刷新一次磁盘和内存状态。

---

### 7. ❤️ 健康检查、备份与回滚意识

运维不只是“发现挂了”，还包括**尽快发现、能留证据、能退回去**。

#### 健康检查
如果应用提供 `/health` 或类似接口，可以直接这样测：

```bash
curl -f http://127.0.0.1:3000/health
```

`-f` 的作用是：遇到 4xx / 5xx 时直接返回失败状态，便于脚本和监控系统识别。

#### 备份
数据库至少要有定时备份意识。以 PostgreSQL 为例：

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

#### 回滚
上线前至少保留一个“上一个可用版本”：
- 上一个镜像 tag
- 上一个 release 目录
- 上一个可运行的 PM2 / Systemd 配置

只会部署，不会回滚，线上风险会很高。

---

### 8. 🪵 日志轮转 (Log Rotate)

很多线上故障不是程序挂了，而是日志把磁盘写满了。

Linux 通常用 `logrotate` 控制日志大小和保留周期。你不一定一开始就自己写配置，但要知道这件事存在。

#### 一条够用的原则
- 日志要保留
- 但不能无限增长
- 至少要知道是谁在写日志、日志写到哪里、多久清一次

---

> **一句话理解这一层**
> 运维级的核心不是“会敲更多命令”，而是你开始把服务当成一个**持续运行、可能故障、需要观测和恢复**的系统来看待。

---

## 最后总结

如果按学习顺序看，这份资料对应的是一条很清晰的成长路径：

- 先学会在 Linux 里不迷路、不误操作
- 再学会把项目稳定部署到服务器
- 最后学会把服务做成可自动化、可监控、可恢复的系统

如果你能把这三层都打通，你就已经不是单纯“会写代码”，而是具备了把代码真正交付上线的能力。