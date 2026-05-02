# Hono 后端开发速查手册

在 Hono 框架中，所有中间件和路由的终极奥义都在参数 **`c` (Context / 上下文)** 里面。它就是全栈开发中“收发快递”的核心枢纽。

## 📦 1. 核心对象 `c` (Context)

`c` 包含了前端发来的请求 (`req`)，发送给前端的工具 (`json`)，以及在后端流转的数据 (`set / get`)。

### 📩 收件 (Request) - 前端传了什么？
你想知道前端传了什么参数，全在 `c.req` 里面找：

- **`c.req.raw`**：最原始的浏览器发出的原生请求对象，可用于读取最底层的 headers。
- **`await c.req.json()`**：读取请求体（Body）里的一大串 JSON 数据（常用于 POST 请求，如登录表单）。

### 📤 寄件 (Response) - 传回给前端什么？
处理完业务后，必须用这几个词结束，反馈给前端：

- **`return c.json({ data: "ok" })`**：最常用的，直接返回一个 JSON 给前端。
- **`return c.json({ error: "权限不足" }, 401)`**：返回 JSON 同时，附带 HTTP 状态码（比如 401 拦截）。
- **`return c.text("Hello")`**：返回纯文本。

### 🏷️ 传纸条 (State) - 服务内部传数据
在中间件（比如保安拦截请求）拿到数据后，可以附在包裹上给下游的具体路由：

- 发送端（中间件）：`c.set("user", userObj)`
- 接收端（业务路由）：`const user = c.get("user")`

---

## 🔗 2. 获取 URL 参数的两种方式 (超高频考点)

前端在访问地址获取数据时，有**斜杠**和**问号**两种方式：

### 🔪 方式一：拿“斜杠参数” (Path Parameter)
斜杠参数是直接**嵌在 URL 路径里**的，用来**定位或者查询唯一具体的某一项内容**。

- **前端网址的样子**：`https://yoursite.com/api/articles/123`
- **Hono 路由的写法**：通过冒号 `:id` 占位挖坑。
- **获取方法**：`c.req.param("变量名")`

```typescript
app.get("/api/articles/:id", (c) => {
    // 使用 param 去拿地址栏里的实际数字
    const articleId = c.req.param("id"); 
    console.log(articleId); // 拿到 "123"
    
    return c.json({ msg: `正在查询第 ${articleId} 篇文章` });
});
```

### ❓ 方式二：拿“问号参数” (Query Parameter)
问号参数是在 URL 结尾，通过 `?` 开始拼接的键值对。通常用来做**搜索关键字、条件过滤、列表翻页**等非必需操作。

- **前端网址的样子**：`https://yoursite.com/api/articles?keyword=前端&page=2`
- **Hono 路由的写法**：只需基础路径即可，不需要提前占位挖坑。
- **获取方法**：`c.req.query("键名")`

```typescript
app.get("/api/articles", (c) => {
    // 使用 query 获取问号后面的条件
    const searchKeyword = c.req.query("keyword");
    const pageNumber = c.req.query("page");
    
    console.log(searchKeyword); // 拿到 "前端"
    console.log(pageNumber);    // 拿到 "2"
    
    return c.json({ msg: `正在搜索关键字：${searchKeyword}，第 ${pageNumber} 页` });
});
```

---

> 💡 **总结小提示**
> 找第几个物品（详细看某个），看**斜杠** -> 用 `param`。
> 搜索/翻页/筛选条件（列出一堆），看**问号** -> 用 `query`。
> 提交账号/传长文章保存（不希望别人看到），放**请求体** -> 用 `await c.req.json()`。
