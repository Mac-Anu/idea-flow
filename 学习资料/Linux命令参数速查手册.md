# Linux 命令参数速查手册

## 一、参数的基本规则

Linux 命令的格式通常是：

```
命令 [参数] [目标]
```

参数分两种写法：

| 写法 | 名称 | 例子 |
|------|------|------|
| `-字母` | 短参数 | `ls -l` |
| `--单词` | 长参数 | `ls --all` |

短参数可以**合并写**：

```bash
ls -l -a -h    # 分开写
ls -lah        # 合并写，效果完全一样
```

长参数不能合并，必须分开：

```bash
git log --oneline --graph    # 只能这样
```

> [!TIP]
> 忘记参数时，用 `命令 --help` 查看所有可用参数，例如 `ls --help`。

---

## 二、万能通用参数

这些参数几乎**所有命令**都支持：

| 参数 | 含义 | 例子 |
|------|------|------|
| `--help` | 显示帮助信息 | `git --help` |
| `--version` / `-v` | 显示版本号 | `node --version` |
| `-h` | 帮助（部分命令）或 human-readable | `df -h`（人类可读的磁盘大小） |

---

## 三、文件操作类

### ls — 列出文件

```bash
ls              # 列出当前目录
ls -l           # 详细信息（权限、大小、时间）
ls -a           # 显示隐藏文件（以 . 开头的）
ls -lah         # 三合一：详细 + 隐藏 + 人类可读大小
ls -R           # 递归列出子目录
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-l` | long | 长格式（详细信息） |
| `-a` | all | 全部（包括隐藏文件） |
| `-h` | human-readable | 文件大小用 KB/MB/GB 显示 |
| `-R` | recursive | 递归列出子目录 |
| `-t` | time | 按时间排序 |
| `-S` | size | 按文件大小排序 |

### cp — 复制

```bash
cp file.txt backup.txt         # 复制文件
cp -r folder/ backup_folder/   # 复制整个文件夹
cp -i file.txt dest/           # 覆盖前确认
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-r` | recursive | 递归复制（复制文件夹必须加） |
| `-i` | interactive | 覆盖前询问 |
| `-f` | force | 强制覆盖，不询问 |
| `-v` | verbose | 显示复制过程 |

### mv — 移动/重命名

```bash
mv old.txt new.txt             # 重命名
mv file.txt ~/Desktop/         # 移动到桌面
mv -i file.txt dest/           # 覆盖前确认
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-i` | interactive | 覆盖前询问 |
| `-f` | force | 强制移动 |
| `-v` | verbose | 显示过程 |

### rm — 删除

```bash
rm file.txt                    # 删除文件
rm -r folder/                  # 删除文件夹
rm -rf folder/                 # 强制删除文件夹（不询问）
rm -i file.txt                 # 删除前确认
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-r` | recursive | 递归删除（删除文件夹必须加） |
| `-f` | force | 强制删除，不询问 |
| `-i` | interactive | 每个文件删除前确认 |

> [!CAUTION]
> `rm -rf /` 会删除整个系统！永远不要执行。使用 `rm -rf` 前请三思。

### mkdir — 创建目录

```bash
mkdir mydir                    # 创建目录
mkdir -p a/b/c                 # 一次性创建多层目录
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-p` | parents | 自动创建父目录 |

---

## 四、文件内容查看类

### cat — 查看文件内容

```bash
cat file.txt                   # 查看全部内容
cat -n file.txt                # 显示行号
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-n` | number | 显示行号 |

### head / tail — 查看开头/结尾

```bash
head -5 file.txt               # 查看前 5 行
tail -10 file.txt              # 查看后 10 行
tail -f log.txt                # 实时跟踪文件更新（看日志神器）
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-n 数字` | number | 显示几行（`-5` 是 `-n 5` 的简写） |
| `-f` | follow | 实时跟踪文件末尾的新内容 |

### grep — 搜索内容

```bash
grep "error" log.txt           # 在文件中搜索 "error"
grep -i "error" log.txt        # 忽略大小写
grep -r "TODO" src/            # 在整个目录中递归搜索
grep -n "error" log.txt        # 显示匹配的行号
grep -c "error" log.txt        # 只显示匹配了几行
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-i` | ignore-case | 忽略大小写 |
| `-r` | recursive | 递归搜索目录 |
| `-n` | line-number | 显示行号 |
| `-c` | count | 只显示匹配数量 |
| `-v` | invert | 反向搜索（显示**不包含**关键词的行） |
| `-l` | files-with-matches | 只显示包含关键词的文件名 |

---

## 五、网络类

### ssh — 远程连接

```bash
ssh root@111.228.49.137              # 连接服务器
ssh -p 2222 root@server              # 指定端口
ssh -L 5433:127.0.0.1:5432 root@server -N   # SSH 隧道
ssh -T git@github.com                # 测试连接（不开 shell）
ssh -f -N -L 5433:127.0.0.1:5432 root@server  # 后台运行隧道
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-p` | port | 指定端口 |
| `-L` | local | 本地端口转发（SSH 隧道） |
| `-N` | no command | 不执行远程命令（只做隧道） |
| `-f` | background | 连接后进入后台运行 |
| `-T` | no tty | 不分配终端（用于测试连接） |
| `-i` | identity | 指定私钥文件，如 `-i ~/.ssh/mykey` |
| `-v` | verbose | 显示详细调试信息 |

### curl — 发送 HTTP 请求

```bash
curl https://example.com             # GET 请求
curl -X POST https://api.com/data    # POST 请求
curl -o file.zip https://url/file    # 下载文件并保存
curl -I https://example.com          # 只看响应头
curl -s https://api.com/data         # 静默模式（不显示进度条）
```

| 参数 | 全称 | 含义 |
|------|------|------|
| `-X` | request | 指定请求方法（POST/PUT/DELETE） |
| `-o` | output | 保存到文件 |
| `-O` | remote-name | 用远程文件名保存 |
| `-I` | head | 只获取响应头 |
| `-s` | silent | 静默模式 |
| `-d` | data | 发送的数据，如 `-d '{"name":"test"}'` |
| `-H` | header | 添加请求头，如 `-H "Content-Type: application/json"` |

### nc — 网络连接测试

```bash
nc -zv 111.228.49.137 5432           # 测试端口是否开放
```

| 参数 | 含义 |
|------|------|
| `-z` | 只测试连接，不发送数据 |
| `-v` | 显示详细信息 |

---

## 六、系统管理类

### sudo — 以管理员身份执行

```bash
sudo apt update                      # 以 root 身份更新
sudo -u postgres psql                # 以 postgres 用户身份运行
```

| 参数 | 含义 |
|------|------|
| `-u 用户名` | 以指定用户的身份运行 |

### chmod — 修改权限

```bash
chmod +x script.sh                   # 给文件添加执行权限
chmod 600 ~/.ssh/id_ed25519          # 设置为只有自己可读写
chmod -R 755 folder/                 # 递归修改整个文件夹
```

| 参数 | 含义 |
|------|------|
| `-R` | 递归修改（包括子目录） |
| `+x` | 添加执行权限 |
| `600` | 数字权限：所有者读写，其他人无权限 |
| `755` | 数字权限：所有者全部，其他人读和执行 |

### ps — 查看进程

```bash
ps aux                               # 查看所有进程
ps aux | grep postgres               # 搜索 postgres 相关进程
```

| 参数 | 含义 |
|------|------|
| `a` | 显示所有用户的进程 |
| `u` | 显示详细信息（用户、CPU、内存等） |
| `x` | 包括没有终端的后台进程 |

### systemctl — 服务管理

```bash
sudo systemctl start postgresql      # 启动服务
sudo systemctl stop postgresql       # 停止服务
sudo systemctl restart postgresql    # 重启服务
sudo systemctl status postgresql     # 查看服务状态
sudo systemctl enable postgresql     # 开机自启
```

---

## 七、Git 参数速查

### git add

| 参数 | 含义 | 例子 |
|------|------|------|
| `.` | 添加当前目录所有改动 | `git add .` |
| `-A` | 添加所有改动（包括删除） | `git add -A` |
| 文件名 | 只添加指定文件 | `git add src/db/index.ts` |

### git commit

| 参数 | 含义 | 例子 |
|------|------|------|
| `-m "消息"` | 提交说明 | `git commit -m "修复bug"` |
| `--amend` | 修改上一次提交 | `git commit --amend -m "新消息"` |

### git log

| 参数 | 含义 | 例子 |
|------|------|------|
| `--oneline` | 每条记录只显示一行 | `git log --oneline` |
| `-n 数字` | 只显示最近几条 | `git log -5` |
| `--graph` | 用图形显示分支 | `git log --graph` |

### git push / pull

| 参数 | 含义 | 例子 |
|------|------|------|
| `-u` | 设置上游分支（首次用） | `git push -u origin main` |
| `--force` | 强制推送 | `git push --force`（⚠️ 慎用） |

---

## 八、参数记忆技巧

大多数参数是英文单词的**首字母**，记住全称就不会忘：

| 短参数 | 全称 | 中文 |
|--------|------|------|
| `-r` | **r**ecursive | 递归 |
| `-f` | **f**orce | 强制 |
| `-v` | **v**erbose | 详细/版本 |
| `-i` | **i**nteractive | 交互式 |
| `-n` | **n**umber | 数量 |
| `-a` | **a**ll | 全部 |
| `-l` | **l**ong / **l**ist | 长格式/列表 |
| `-h` | **h**uman-readable / **h**elp | 人类可读/帮助 |
| `-o` | **o**utput | 输出 |
| `-p` | **p**ort / **p**arents | 端口/父目录 |
| `-s` | **s**ilent | 静默 |
| `-u` | **u**ser / **u**pstream | 用户/上游 |

> [!TIP]
> 不确定一个参数什么意思时，用 `man 命令名` 查看手册。例如 `man grep` 会打开 grep 的完整手册。按 `q` 退出。
