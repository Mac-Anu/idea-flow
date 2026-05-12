# 🚀 GitHub Actions 全自动 CI/CD 部署指南

这份指南记录了如何从传统的手动部署，进化为大厂级别的“一键全自动”流水线（CI/CD）架构。

## 为什么要用 GitHub Actions？

- **传统老办法**：本地修改代码 -> `git push` -> SSH 连上云服务器 -> `git pull` -> 服务器上执行耗时的 `npm build` 占用 CPU -> 用 PM2 重启应用。
- **大厂黄金玩法（CI/CD）**：本地修改代码 -> `git push` -> **下班回家**。
（GitHub 云端机器会自动检测到你的 Push，在它免费的超强云端服务器上打包好 Docker 镜像，然后自动 SSH 登录你的服务器下发拉取和重启指令）。

---

## 步骤一：准备 Docker Hub 账号
我们打包好的应用集装箱（镜像）需要一个公共中转站存放。

1. 登录 [Docker Hub](https://hub.docker.com/) 注册一个免费账号。
2. 建议使用邮箱+密码直接注册，这样你会拥有明确的：
   - **Docker ID (Username)**：纯小写英文字母+数字，比如 `alanwa1ker`。
   - **密码 (Password)** 或后台生成的 Personal Access Token。

---

## 步骤二：给 GitHub 项目配置“密码箱” (Secrets)

机器人在替你干活时，需要你的权限。为了绝对安全，这些绝密数据坚决不能写在代码里，而是存进 GitHub 的密码箱中。

1. 网页进入你的 GitHub 项目仓库主页。
2. 依次点击顶部菜单 **Settings** -> 左侧边栏 **Secrets and variables** -> **Actions**。
3. 点击绿色的 **New repository secret** 按钮，一共添加以下 5 把钥匙：

| Secret 名称 (Name) | 填入的值 (Secret Value) | 备注说明 |
| :--- | :--- | :--- |
| `DOCKER_USERNAME` | `你的 Docker ID` | 比如 `alanwa1ker`，纯小写 |
| `DOCKER_PASSWORD` | `Docker 密码或 Token` | 你的 Docker Hub 登录凭证 |
| `SERVER_HOST` | `111.xxx.xxx.xxx` | 你云服务器的公网 IP 地址 |
| `SERVER_USERNAME` | `root` | 云服务器的登录名 (root/ubuntu 等) |
| `SERVER_SSH_KEY` | `-----BEGIN...` | 本地电脑 `~/.ssh/id_rsa` 等私钥文件的完整内容，头尾的虚线一定要带上 |

---

## 步骤三：编写自动化剧本 (.yml)

在本地项目根目录下创建层级文件夹和文件：`.github/workflows/deploy.yml`。

这个文件就是你给机器人下达的标准行动指令：

```yaml
name: Deploy Next.js App

# 只要 main 分支有 push，就立刻触发
on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/idea-flow:latest

      - name: Deploy to Server via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USERNAME }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/idea-flow
            docker compose pull
            docker compose up -d
            docker system prune -f
```

---

## 步骤四：服务器端的接应大本营

光有 Github Actions 还不够，你的服务器上需要提前布置好 `docker-compose.yml` 收货清单。

在服务器的 `/opt/idea-flow/` 目录下，必须有这两个文件安安静静躺着等待：

**1. `.env` 文件**（存放数据库地址等私密环境变量，注意将 localhost 换成 `shared-postgres` 等容器内网名字，保障绝对安全与连通）

**2. `docker-compose.yml`**：
```yaml
version: '3.8'

services:
  web:
    # 这里必须填入你刚才让机器人打包发上去的那个对应镜像地址！
    image: 你的DockerID/idea-flow:latest
    container_name: idea-flow-web
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env

# 连接全局共享网络，这步极其核心，否则应用找不到数据库
networks:
  default:
    name: global-infra
    external: true
```

---

## 🎉 最终的日常开发体验

完成这一切后，你不仅大幅度降低了云服务器的 CPU 消耗，更是拥有了极客级的丝滑体验：

在本地疯狂撸代码 -> 觉得满意了 -> 敲三句 Git 命令 `git add .`, `git commit`, `git push` -> 看着 Actions 圆圈转绿 -> 网站秒级更新上线！
