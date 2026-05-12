# 🌐 Nginx 反向代理与 Web 服务器指南

在现代全栈开发中，Nginx 是应用上线前必经的“大门”。不论你的后端是用 Node.js、Python 写的，还是跑在 Docker 里，**业界最标准、最安全、最高效的做法**，都是在最外层架设一台 Nginx，由它来接收公网的所有请求，然后再转发（反向代理）给内部的具体服务。

---

## 1. 什么是 Nginx，为什么要用它？

- **反向代理（Reverse Proxy）**：你的 Node.js 或 Docker 跑在内网的 `3000` 端口，外网无法直接访问（或者加上端口号访问太丑）。Nginx 监听公网标准的 `80` 和 `443` 端口，自动把请求转发给内部的 `3000` 端口。
- **配置 HTTPS 极其方便**：Node.js 原生配置 SSL 证书很痛苦，而交给 Nginx 和 Certbot 处理只需要一行命令。
- **静态资源终结者**：处理图片、CSS、JS 等静态文件，Nginx 的性能是 Node.js 的数十倍。
- **负载均衡与防 DOSS**：限制单个 IP 的访问频率，保护内部脆弱的服务。

---

## 2. 基础安装与核心命令

在 Ubuntu/Debian 上安装：
```bash
sudo apt update
sudo apt install nginx -y
```

### 运维必会命令

- `nginx -t`：**极其重要**！每次改完配置文件后，**必须**先跑这条命令，如果显示 `syntax is ok` 且 `test is successful` 才代表配置没写错。
- `systemctl reload nginx`：平滑重载配置（不断开当前用户的连接），改完配置且 `-t` 通过后使用。
- `systemctl restart nginx`：强制重启 Nginx 服务。
- `systemctl status nginx`：查看 Nginx 运行状态和报错日志。

---

## 3. Nginx 的核心目录结构

知道去哪里找配置文件，是掌控 Nginx 的第一步：

- `/etc/nginx/nginx.conf`：全局主配置文件（一般不需要改）。
- `/etc/nginx/sites-available/`：存放所有站点的配置“草稿”。
- `/etc/nginx/sites-enabled/`：存放真正**生效**的站点配置（这里的通常是上一层的软连接）。
- `/var/log/nginx/`：日志目录。查错必看里面的 `error.log`。

---

## 4. 实战一：配置全栈项目反向代理

假设你有一个跑在服务器 `3000` 端口的 Next.js 项目，你想让用户通过域名 `example.com` 访问它。

### Step 1: 创建配置文件
使用 vim 创建一个新的配置文件：
```bash
sudo vim /etc/nginx/sites-available/idea-flow.conf
```

### Step 2: 写入核心配置
```nginx
server {
    listen 80;
    server_name example.com; # 换成你的域名，如果没有域名暂时用 _ 代替匹配所有

    location / {
        # 把请求转发给本机的 3000 端口
        proxy_pass http://127.0.0.1:3000;
        
        # 传递真实的客户端 IP 和协议头给后端代码
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 3: 激活配置并重启
```bash
# 1. 创建一个快捷方式（软链接）到 enabled 目录，代表激活这个站点
sudo ln -s /etc/nginx/sites-available/idea-flow.conf /etc/nginx/sites-enabled/

# 2. 测试有没有语法错误
sudo nginx -t

# 3. 平滑重载让配置生效
sudo systemctl reload nginx
```

---

## 5. 实战二：一键部署免费 HTTPS 证书

配置 HTTPS 在过去极其复杂，现在只要有了 `certbot`，就是傻瓜式操作。

### Step 1: 安装 Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: 自动签发并配置
```bash
# 这个命令会自动读取你的 Nginx 配置，去验证域名，并自动帮你修改 conf 文件配好 SSL！
sudo certbot --nginx -d example.com
```

执行时，它会问你是否需要把所有 HTTP 请求强制跳转到 HTTPS（Redirect），强烈建议选择 **2 (Redirect)**。

---

## 6. 实战三：代理 Websocket (如 Socket.io)

如果你的 Node.js 或 Docker 容器里用到了 WebSocket 实现实时通信，默认的 Nginx 配置是会拦截掉升级请求的，你需要稍微修改一下 `location`：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    
    # WebSocket 特有配置，支持 HTTP 协议向 WS 协议升级
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## 💡 常见排错指南

1. **502 Bad Gateway**：
   - 原因：Nginx 活得好好的，但它背后要转发的 `3000` 端口挂了。
   - 解决：去检查你的 Node.js 进程（`pm2 logs`）或者 Docker 容器（`docker ps`）是不是死了。

2. **504 Gateway Time-out**：
   - 原因：背后的 Node.js 服务收到了请求，但卡死了一直不回消息（通常是死循环或连不上数据库）。
   - 解决：检查后端代码逻辑，或增大 Nginx 的 `proxy_read_timeout`。

3. **修改完代码没生效**：
   - 记住：修改 Nginx 配置需要 `systemctl reload nginx`；但如果你修改的是 Node.js 业务代码，Nginx 不需要动，你需要重启的是 Node.js（`pm2 restart` 或 `docker-compose restart`）。
