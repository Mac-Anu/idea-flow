# Git + GitHub 配置与使用指南

## 一、SSH 密钥配置

### 1.1 生成 SSH 密钥

```bash
ssh-keygen -t ed25519 -C "你的备注，比如设备名"
```

- 一路回车即可（保存路径和密码都用默认值）
- 会生成两个文件：
  - `~/.ssh/id_ed25519` — **私钥**（钥匙，绝对不能分享）
  - `~/.ssh/id_ed25519.pub` — **公钥**（锁，可以添加到任何服务）

### 1.2 查看公钥

```bash
cat ~/.ssh/id_ed25519.pub
```

输出类似：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... felix_m4_mini
```

### 1.3 将公钥添加到 GitHub

1. 打开 https://github.com/settings/keys
2. 点 **New SSH key**
3. **Title**：填设备名（如 `Mac Mini`、`MacBook Pro`）
4. **Key**：粘贴上一步 `cat` 出来的完整内容
5. 点 **Add SSH key**
6. GitHub 会发验证码到你的邮箱，输入后完成添加

### 1.4 配置 SSH（解决国内网络连接问题）

国内网络可能屏蔽 GitHub 的 22 端口，需要改用 443 端口。编辑 `~/.ssh/config`：

```bash
vim ~/.ssh/config
```

添加以下内容：

```
Host github.com
  Hostname ssh.github.com
  Port 443
  User git
  IdentityFile ~/.ssh/id_ed25519
  AddKeysToAgent yes
```

### 1.5 添加 GitHub 主机指纹

首次使用需要信任 GitHub 的服务器指纹：

```bash
ssh-keyscan -p 443 ssh.github.com >> ~/.ssh/known_hosts 2>/dev/null
```

### 1.6 加载密钥到 SSH Agent

```bash
ssh-add ~/.ssh/id_ed25519
```

### 1.7 测试连接

```bash
ssh -T git@github.com
```

看到以下输出就说明成功了：

```
Hi Bruce-L-J! You've successfully authenticated, but GitHub does not provide shell access.
```

> [!NOTE]
> exit code 1 是正常的，GitHub 不提供 shell 登录。

---

## 二、Git 初始化与推送

### 2.1 初始化 Git 仓库

```bash
cd ~/your-project       # 进入项目目录
git init                # 初始化 Git
```

### 2.2 首次提交

```bash
git add .                        # 将所有文件加入暂存区
git commit -m "初始化项目"         # 提交到本地仓库
```

### 2.3 在 GitHub 创建远程仓库

1. 打开 https://github.com/new
2. 填写仓库名（如 `idea-flow`）
3. 选择 **Private**（私有仓库）
4. **不要**勾选 README、.gitignore、license（本地已有）
5. 点 **Create repository**

### 2.4 关联远程仓库并推送

```bash
git remote add origin git@github.com:你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

> [!IMPORTANT]
> `git remote add origin` 只需执行一次。之后推送只需 `git push`。

---

## 三、日常开发流程

### 3.1 改完代码后提交并推送

```bash
git add .                          # 暂存所有改动
git commit -m "描述你改了什么"       # 提交到本地
git push                           # 推送到 GitHub
```

### 3.2 从 GitHub 拉取最新代码

```bash
git pull                           # 从 GitHub 拉取并合并
```

### 3.3 查看状态

```bash
git status                         # 查看哪些文件被修改了
git log --oneline -10              # 查看最近 10 条提交记录
git diff                           # 查看具体改了什么
```

---

## 四、在另一台电脑上开发

### 4.1 新电脑初始化

```bash
# 1. 生成新的 SSH 密钥
ssh-keygen -t ed25519 -C "新设备名"

# 2. 查看并复制公钥
cat ~/.ssh/id_ed25519.pub

# 3. 将公钥添加到 GitHub（同 1.3 步骤）

# 4. 配置 SSH（同 1.4 - 1.6 步骤）

# 5. 克隆项目
git clone git@github.com:Bruce-L-J/idea-flow.git
cd idea-flow

# 6. 安装依赖
pnpm install

# 7. 手动创建 .env 文件（从密码管理器复制，.env 不会上传到 GitHub）

# 8. 开始开发
pnpm dev
```

> [!CAUTION]
> 每台新电脑都应该**生成自己的密钥对**，不要拷贝私钥到其他设备。

---

## 五、出售/废弃设备时的清理

```bash
# 1. 删除本机 SSH 密钥
rm -rf ~/.ssh

# 2. 去 GitHub 删除该设备的公钥
#    https://github.com/settings/keys → 删除对应的 key

# 3. 去京东云服务器删除公钥
#    编辑服务器上的 ~/.ssh/authorized_keys，删掉对应行

# 4. 抹掉 Mac 并重装系统再出售
```

---

## 六、常用命令速查表

| 命令 | 作用 |
|------|------|
| `git init` | 初始化仓库 |
| `git add .` | 暂存所有改动 |
| `git commit -m "消息"` | 提交到本地 |
| `git push` | 推送到 GitHub |
| `git pull` | 从 GitHub 拉取 |
| `git status` | 查看改动状态 |
| `git log --oneline -10` | 查看最近提交 |
| `git diff` | 查看具体改动内容 |
| `git remote -v` | 查看远程仓库地址 |
| `git remote set-url origin 新地址` | 修改远程仓库地址 |
| `git clone 地址` | 克隆远程仓库 |
| `ssh-keygen -t ed25519 -C "备注"` | 生成 SSH 密钥 |
| `ssh-add ~/.ssh/id_ed25519` | 加载密钥到 Agent |
| `ssh -T git@github.com` | 测试 GitHub SSH 连接 |

---

## 七、.gitignore 说明

`.gitignore` 文件控制哪些文件**不会**被提交到 GitHub：

```
.env*           ← 环境变量（含密码，绝对不能上传）
node_modules/   ← 依赖包（太大，别人 pnpm install 重新装）
.next/          ← 构建产物（可以重新生成）
```

> [!WARNING]
> 如果 `.env` 被意外提交到 GitHub，即使后来删除，历史记录里仍然可以看到。
> 密码泄露后必须**立刻更换所有密码**。
