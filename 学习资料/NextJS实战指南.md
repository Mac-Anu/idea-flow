# 🧩 Next.js 实战指南

> **目标**：从零理解 Next.js 的核心玩法，让你的页面真正活起来。

---

## 第一部分：入门三板斧

### 1. 换个地址 (Routing - 路由)

Next.js 的路由系统极其简单：**你建一个文件夹，它就帮你创建一个网址。**

```
app/
├── page.tsx              → 访问 /
├── articles/
│   ├── page.tsx          → 访问 /articles
│   └── [id]/
│       └── page.tsx      → 访问 /articles/xxx (动态路由)
```

**动态路由 `[id]`**：文件夹名字加了方括号，就能变成无数个页面。
- 访问 `/articles/abc123` → `[id]` 就等于 `abc123`
- 在代码里通过 `params.id` 拿到这个值

### 2. 连接页面 (Linking - 导航)

```tsx
import Link from "next/link";

// 用 Link 组件包裹，点击就能跳转，无需刷新整个页面
<Link href="/articles">去文章列表</Link>
<Link href={`/articles/${article.id}`}>查看详情</Link>
```

### 3. 拆解网页 (Components - 组件化)

把 `page.tsx` 里太长的部分，剪切到 `components/` 文件夹里：
```tsx
// components/ArticleCard.tsx
export default function ArticleCard({ title }) {
    return <div className="...">{title}</div>;
}

// page.tsx 里只需要引用
import ArticleCard from "@/components/ArticleCard";
```

**口诀：一次编写，到处使用。**

---

## 第二部分：深度进阶

### 1. 动静分离（Server vs Client Component）

这是 Next.js 最核心的架构概念：

| 类型 | 关键词 | 职责 | 能做什么 |
|:---|:---|:---|:---|
| **Server Component** | 默认（不写任何标记） | 处理数据 | 读数据库、调 API |
| **Client Component** | 文件顶部写 `"use client"` | 处理交互 | 动画、按钮点击、useState |

**黄金法则：**
- 能在服务端做的事情，绝不拿到客户端做。
- 只有需要"跟用户互动"的部分（按钮点击、输入框、动画），才标记为 `"use client"`。

### 2. 数据获取 (Data Fetching)

```tsx
// Server Component（默认）里可以直接 async/await
export default async function ArticlesPage() {
    // 直接在组件里拿数据，不需要 useEffect
    const res = await fetch("http://localhost:3000/api/articles");
    const data = await res.json();
    
    return <div>{data.map(article => ...)}</div>;
}
```

**为什么不用 useEffect？**
因为 Server Component 在服务器上运行，它可以直接访问数据库或 API，数据拿完后才把渲染好的 HTML 发给浏览器。用户看到页面的瞬间，数据已经在了。

### 3. 布局系统 (Layout)

`layout.tsx` 是 Next.js 的"套娃机制"：

```
app/
├── layout.tsx        ← 全局布局（导航栏、字体）
├── (app)/
│   ├── layout.tsx    ← 应用内布局（侧边栏）
│   └── articles/
│       └── page.tsx  ← 具体页面内容
```

每一层 `layout.tsx` 会自动包裹里面所有的子页面，实现"页面切换时，侧边栏不会重新加载"的丝滑效果。

### 4. 避坑指南：水合（Hydration）与 DOM 操作

当你在 Client Component 中使用 `dangerouslySetInnerHTML` 并尝试用 JS 原生查询 DOM 时，**千万不要预先把真实 DOM 节点或 ID 存到 State/Ref 里！**

**问题场景：**
React 在客户端进行 Hydration（水合）时，可能会丢弃原有的 DOM 节点并重新创建（尤其在遇到内容不一致或者复杂更新时）。如果你一开始用 `document.getElementById(id)` 绑定了元素，后续跳转或监听时就会发现节点已失效/丢失（报错 Null 或点击没反应）。

**终极解法：**
永远在事件触发的**那一瞬间**，去动态查询真实的 DOM 节点：
```tsx
// ❌ 错误做法：在 useEffect 里获取节点并存下来，或者给它加 ID 存 ID
useEffect(() => {
    const els = contentRef.current.querySelectorAll("h1");
    setHeadingEls(els); // Hydration 后，这些存下来的节点可能被 React 扔掉变成了死节点
}, []);

// ✅ 正确做法：不要存 DOM，只存索引。点击时动态抓取当前页面最新的 DOM
const handleClick = (index) => {
    const els = Array.from(contentRef.current.querySelectorAll("h1, h2, h3"));
    const el = els[index];
    el.scrollIntoView();
};
```

---

> **💡 一句话总结**
> Next.js 本质上就是一个"文件管理器"。你只需要学会把正确的文件放在正确的文件夹里，它就会帮你搞定剩下的所有事。
