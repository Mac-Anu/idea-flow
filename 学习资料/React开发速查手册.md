# 🚀 React / Next.js 开发速查手册

> 自主开发必备的代码模式与技巧，记住这些，开发效率翻倍！

---

## 🪝 一、核心 Hooks 篇

### 1. useState（状态管理）

**核心原则**：状态改变才会触发重新渲染。**永远不要直接修改原值**，必须传新值。

#### 开关切换

```tsx
const [isOpen, setIsOpen] = useState(false);
const toggle = () => setIsOpen((prev) => !prev);
```

#### 表单输入

```tsx
const [value, setValue] = useState("");
<input value={value} onChange={(e) => setValue(e.target.value)} />;
```

#### 对象状态更新

```tsx
const [form, setForm] = useState({ name: "", email: "" });
const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value })); // 保留其他字段
};
```

---

### 2. useRef（引用与存值）

**核心原则**：useRef 是一个"存东西的盒子"，值改变**不会触发重新渲染**。

#### 用途 A：获取 DOM 元素（最常用）

```tsx
const inputRef = useRef<HTMLInputElement>(null);

// 此时必须在页面加载后（或事件里）操作元素
useEffect(() => {
    inputRef.current?.focus(); // 🌐 浏览器原生 DOM 操作
}, []);

<input ref={inputRef} />; // 绑定引用
```

_提示：`<input>` 用 `HTMLInputElement`，`<button>` 用 `HTMLButtonElement`，写什么标签用什么类型。_

#### 用途 B：存储不需要渲染的值

```tsx
// 存储定时器 ID
const timerRef = useRef<number | null>(null);
timerRef.current = setInterval(() => {}, 1000);

// 存储上一次的值
const prevValueRef = useRef<string>("");
```

#### useRef vs useState 对比

| 特性       | useState         | useRef           |
| ---------- | ---------------- | ---------------- |
| 改变后渲染 | ✅ 会            | ❌ 不会          |
| 读取方式   | `value`          | `ref.current`    |
| 适用场景   | 显示在页面的数据 | DOM引用/临时存值 |

---

### 3. useEffect（副作用处理）

**核心原则**：用于处理组件渲染之外的事情（获取数据、监听事件、定时器等）。

#### 三大模式

```tsx
// 模式 1：仅挂载时执行一次（常用于初始化数据）
useEffect(() => {
    fetchData();
}, []);

// 模式 2：依赖项变化时执行
useEffect(() => {
    searchAPI(searchTerm);
}, [searchTerm]);

// 模式 3：需要清理的副作用（防止内存泄漏）
useEffect(() => {
    const timer = setInterval(() => console.log("tick"), 1000);
    return () => clearInterval(timer); // 👈 组件卸载时自动清理
}, []);

// 模式 4：按键全局监听
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown); // 卸载监听
}, []);
```

---

### 4. 自定义 Hook

**核心原则**：把重复的 Hooks 组合逻辑打包成 `useXxx` 函数复用。

#### 命名与创建

```tsx
// ✅ 必须以 use 开头
function useToggle(initial = false) {
    const [value, setValue] = useState(initial);
    return {
        value,
        toggle: () => setValue((v) => !v),
        setTrue: () => setValue(true),
        setFalse: () => setValue(false),
    };
}

// 使用
const modal = useToggle();
<button onClick={modal.toggle}>切换</button>;
```

#### 实用模板：useDebounce (防抖)

```tsx
function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}
```

## 📦 二、CRUD 与数据篇

### 1. 数组状态 CRUD 操作

_在 React 中操作数组状态时，永远不要直接修改原数组，必须返回新数组。_

| 操作     | 方法       | 代码模板                                                 |
| -------- | ---------- | -------------------------------------------------------- |
| **新增** | `...` 展开 | `prev => [...prev, newItem]`                             |
| **删除** | `filter`   | `prev => prev.filter(x => x.id !== id)`                  |
| **修改** | `map`      | `prev => prev.map(x => x.id === id ? {...x, title} : x)` |
| **查询** | `find`     | `arr.find(x => x.id === id)`                             |

### 2. Server Actions CRUD 操作

_通用的服务端数据库操作公式，换个表名基本都能直接用。_

```tsx
"use server";
import { db } from "@/db";
import { 表名 } from "@/db/schema";
import { eq } from "drizzle-orm";

// 增 Create
export async function addXxx(title: string) {
    const [newItem] = await db.insert(表名).values({ title }).returning();
    return newItem;
}

// 删 Delete
export async function deleteXxx(id: string) {
    await db.delete(表名).where(eq(表名.id, id));
}

// 改 Update
export async function updateXxx(id: string, title: string) {
    await db.update(表名).set({ title, updatedAt: new Date() }).where(eq(表名.id, id));
}

// 查 Read
export async function getXxx() {
    try {
        return await db.select().from(表名);
    } catch (error) {
        console.error("失败:", error);
        return [];
    }
}
```

### 3. 两大 CRUD 架构模式：单页 vs 路由

_核心区别：编辑数据是在当前页面，还是跳到一个独立新页面？_

| 单页 CRUD（如 Notes 列表）             | 路由 CRUD（如 Articles 详情）                |
| -------------------------------------- | -------------------------------------------- |
| 适合：**短内容**（便签、TODO）         | 适合：**长内容**（带标题+正文+Markdown）     |
| 操作：全部在列表页完成，行内编辑       | 操作：列表展示，点击跳 `/articles/[id]` 编辑 |
| 状态：`useState` 维护列表              | 状态：Server Component 拿数据，无本地状态    |
| 刷新：`setNotes(prev => ...)` 更新本地 | 刷新：`router.refresh()` 让服务器重新拉数据  |

---

## 🎯 三、UI 与交互篇

### 1. 条件渲染与状态显示

| 场景           | 写法        | 示例                                          |
| -------------- | ----------- | --------------------------------------------- |
| **有就显示**   | `A && B`    | `{isOpen && <Modal />}`                       |
| **二选一**     | `A ? B : C` | `{isLoading ? <Spinner /> : <Content />}`     |
| **空状态显示** | `---`       | `{items.length === 0 ? <Empty /> : <List />}` |

### 2. 事件处理模式

```tsx
// 阻止默认行为（比如提交表单不再刷新页面）
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
};

// 阻止事件冒泡（比如点了卡片里的红桃，别触发整张卡片的点击）
const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
};
```

### 3. 键盘事件（Enter提交 & ESC取消）

_常见需求：行内编辑或表单时，按 Enter 键保存，按 ESC 取消。_

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
        // 🌐 浏览器原生事件
        e.preventDefault(); // 阻止回车默认的换行/提交
        handleSave();
    }
    if (e.key === "Escape") {
        handleCancel();
    }
};

<input onKeyDown={handleKeyDown} />;
```

### 4. 组件通信（父子传值）

```tsx
// 父亲：传状态和回调函数
<Child name={userName} onNameChange={setUserName} />;

// 儿子：接收和调用
function Child({ name, onNameChange }: { name: string; onNameChange: (v: string) => void }) {
    return <input value={name} onChange={(e) => onNameChange(e.target.value)} />;
}
```

## 🧭 四、Next.js 篇

### 1. 文件约定

| 文件名          | 作用                   |
| --------------- | ---------------------- |
| `page.tsx`      | 页面组件（定义路由）   |
| `layout.tsx`    | 布局组件（包裹子页面） |
| `loading.tsx`   | 加载状态 UI            |
| `error.tsx`     | 错误处理 UI            |
| `not-found.tsx` | 404 页面               |
| `route.ts`      | API 路由               |

**路由分组 `(folder_name)`：纯粹为了归类文件，不会影响访问路径。**

```
app/(app)/articles  --> 访问路径是 /articles
app/(app)/dashboard --> 访问路径是 /dashboard
```

### 2. 路由导航（useRouter）

在客户端组件中用 `useRouter()` 进行编程式导航。

```tsx
"use client";
import { useRouter } from "next/navigation"; // ⚠️ 是 next/navigation，不是 next/router

export default function MyComponent() {
    const router = useRouter();
    // ...
}
```

| 方法                  | 作用                                       | 示例                           |
| --------------------- | ------------------------------------------ | ------------------------------ |
| `router.push(url)`    | 跳转到新页面（加入历史记录）               | `router.push("/articles/123")` |
| `router.replace(url)` | 跳转到新页面（**替换**历史，后退不会回来） | `router.replace("/dashboard")` |
| `router.back()`       | 返回上一页                                 | `router.back()`                |
| `router.refresh()`    | **重新请求当前页面的服务端数据**           | `router.refresh()`             |

#### router.refresh() 的魔法

这是 Next.js 取数据的核心模式：修改数据后，不想手动改本地状态？直接调 `router.refresh()`！

```tsx
const handleDelete = async () => {
    await deleteArticle(id); // 删库
    router.refresh(); // 让服务端重新拉数据，页面自动去掉那条
};
```

### 3. `<Link>` 组件 vs `router.push()`

|          | `<Link>`                         | `router.push()`                   |
| -------- | -------------------------------- | --------------------------------- |
| 适用场景 | 静态导航（侧边栏、底部链接）     | 动态/条件导航（先处理业务再跳转） |
| 特性     | ✅ 渲染 `<a>`、✅ 自动预加载预取 | ❌ 不是标签、❌ 需处理完再跳      |

---

## 🛠 五、工具与样式篇

### 1. Tailwind css 类名管理 `cn()`

用 `shadcn-ui` 或现代组件库必用函数。

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 合并冲突的 Tailwind 类名 (如 p-4 p-8 -> p-8)
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 用法示例：条件样式渲染
<div className={cn(
  "flex items-center gap-4 transition-all",
  isActive ? "text-indigo-600 font-bold" : "text-zinc-500",
  isDisabled && "opacity-50 cursor-not-allowed" // 更干净的判断
)}>
```

### 2. 实用工具函数

#### 格式化日期

```tsx
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
};
```

### 3. TypeScript 基础

- 组件 Props 用 `interface`
- State 要标明泛型类型：`useState<Note[]>([]);`
- 可能为空加上 `| null`
- React 自带事件泛型：
    - `React.ChangeEvent<HTMLInputElement>` (输入框 onChange)
    - `React.MouseEvent<HTMLButtonElement>` (按钮 onClick)
    - `React.KeyboardEvent` (键盘按键)

### 4. 调试进阶技巧

_不是 `console.log` 打天下，这些技巧能让你的调试效率翻倍。_

#### 打印数组/对象用 `console.table()`

```tsx
// 普通 log 打印一坨看不清层级的对象
console.log(articles); // 😵 [Object, Object, Object...]

// 用 table 直接变成表格，一目了然！
console.table(articles); // 🤩 整齐的表格，列名就是字段名
console.table(articles, ["id", "title"]); // 还能指定只看哪几列
```

#### 计算代码执行耗时用 `console.time()`

```tsx
console.time("数据库查询耗时");
const data = await db.select().from(articles);
console.timeEnd("数据库查询耗时"); // 输出：数据库查询耗时: 42.8ms
```

#### Chrome 条件断点（Conditional Breakpoint）

在 Chrome DevTools → Sources 面板里，**右键点击行号 → Add Conditional Breakpoint**：

```
// 只在 id === "特定ID" 时才暂停，不用每次循环都停下来
article.id === "abc123"
```

#### React DevTools 查看组件状态

安装 [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools) 浏览器插件后：

| 面板        | 用途                                                |
| ----------- | --------------------------------------------------- |
| Components  | 点击任意组件，实时查看它的 Props、State、Hooks 的值 |
| Profiler    | 录制一段操作，看哪个组件重新渲染了、耗时多少        |
| ⚙️ 高亮渲染 | 勾选 "Highlight updates" 后，重渲染的组件会闪绿框   |

#### 网络请求调试速查

| 排查目标       | DevTools 位置                 | 看什么                               |
| -------------- | ----------------------------- | ------------------------------------ |
| 请求是否发出   | Network → 找对应的请求行      | 有没有这行记录                       |
| 请求参数对不对 | 点击请求 → Payload / Headers  | 看 Request Body 和 Query String      |
| 返回数据对不对 | 点击请求 → Response / Preview | 看服务端返回的 JSON 内容             |
| 状态码异常     | 看请求行的 Status 列          | 200=成功，404=找不到，500=服务端炸了 |

---

## 🎓 六、记忆口诀

### 📦 数组 CRUD

> 增用展开 `[...prev, new]`
> 删用过滤 `filter` 留
> 改用映射 `map` 替换
> 查用 `find` 来定位

### 🔄 useEffect

> 空数组跑一次
> 有值就监听它
> 清理用 `return`
> 忘写依赖会死循环

### 📌 useRef

> 本质是个小盒子，装DOM或装变量
> 盒子名叫 `current` ，变了从来不渲染
> 想拿 DOM 找 useRef，临时记数找 useRef
> 如果你要展页面，老老实实用 useState

### ⚡ 状态管理

> 状态不变创新值
> prev 回调最安全
> 对象展开再覆盖
> 数组方法返新值

### 🎨 条件渲染

> 有就显示用 `&&`
> 二选一用 `?:`
> 空状态要兜底
> 层级 `key` 值必须有

---

## 🐻 七、Zustand 全局状态管理篇

> Zustand 是 React 生态中最轻量、最主流的全局状态管理库。
> 核心能力：让任意两个不相连的组件共享数据，且精准控制渲染。

### 1. 创建 Store（建仓库）

_所有 Store 文件统一放在 `src/store/` 目录下，命名以 `use` 开头。_

```tsx
// src/store/useArticleStore.ts
import { create } from "zustand";

// 第一步：定义接口（仓库长什么样）
interface ArticleStore {
    activeArticleId: string | null;
    activeArticleTitle: string;
    setActiveArticle: (id: string, title: string) => void;
    updateActiveTitle: (title: string) => void;
}

// 第二步：用 create 创建仓库（数据 + 操作函数 放在一起）
export const useArticleStore = create<ArticleStore>((set) => ({
    activeArticleId: null,
    activeArticleTitle: "",
    setActiveArticle: (id, title) => set({ activeArticleId: id, activeArticleTitle: title }),
    updateActiveTitle: (title) => set({ activeArticleTitle: title }),
}));
```

> **要点**：`set()` 是 Zustand 提供的更新函数，会自动**浅合并**（只覆盖你传入的字段，其余保留）。

---

### 2. 读取数据（Selector 精确订阅）

_组件里用 `useStore((state) => state.xxx)` 精确取值，只有取到的值变了，组件才重新渲染。_

```tsx
import { useArticleStore } from "@/store/useArticleStore";

// ✅ 推荐：精确订阅，只在 activeArticleTitle 变化时重渲染
const title = useArticleStore((state) => state.activeArticleTitle);
const id = useArticleStore((state) => state.activeArticleId);

// ❌ 不推荐：取整个 store，任何字段变了都会导致重渲染
const store = useArticleStore();
```

> **口诀**：取数据永远用 `(state) => state.xxx` 箭头函数，精确打击，拒绝地毯式轰炸。

---

### 3. 写入数据 — 方式 A：事件驱动（用户点击/打字触发）

_大多数场景！用户的交互事件里直接调用 store 的方法。_

```tsx
const { updateActiveTitle } = useArticleStore();

// 在 onChange、onClick 等事件里直接调用
<input
    value={title}
    onChange={(e) => {
        setTitle(e.target.value); // 更新组件本地状态
        updateActiveTitle(e.target.value); // 同步写入 Zustand 全局仓库
    }}
/>;
```

> **要点**：只要是"用户的手"触发的操作，**不需要 `useEffect`**，直接在事件回调里写就行。

---

### 4. 写入数据 — 方式 B：useEffect 初始化（组件加载/数据变化时自动同步）

_当需要把从服务端拿到的初始数据"搬运"进 Zustand 时，必须借助 `useEffect`。_

```tsx
const { setActiveArticle } = useArticleStore();

// 组件一加载，就把从数据库查出来的文章信息塞进全局仓库
useEffect(() => {
    setActiveArticle(article.id, article.title === "无标题文章" ? "" : article.title);
}, [article.id, article.title, setActiveArticle]);
```

> **何时用 useEffect？** 组件挂载时自动同步、监听路由变化、定时轮询等"非用户点击"触发的场景。

---

### 5. 跨组件同步实战公式

_经典场景：编辑器打字 → 侧边栏列表标题实时跟变（Notion 体验）。_

```tsx
// 侧边栏里：根据 ID 判断该显示 Zustand 实时标题还是数据库旧标题
const activeId = useArticleStore((state) => state.activeArticleId);
const activeTitle = useArticleStore((state) => state.activeArticleTitle);

{
    articles.map((article) => {
        // 核心判断：这篇文章是不是正在被编辑的那篇？
        const displayTitle =
            article.id === activeId
                ? activeTitle || "无标题文章" // 是 → 用 Zustand 里的实时新标题
                : article.title || "无标题文章"; // 不是 → 用数据库里的原标题

        return <span>{displayTitle}</span>;
    });
}
```

---

### 6. persist 持久化（关浏览器也不丢数据）

_Zustand 官方中间件，自动把状态存入 `localStorage`，刷新/关闭后恢复原样。_

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDraftStore = create(
    persist(
        (set) => ({
            draftText: "",
            setDraft: (text: string) => set({ draftText: text }),
        }),
        { name: "my-draft-storage" }, // localStorage 的 key 名
    ),
);
```

> **用途**：草稿自动恢复、用户偏好设置（深色模式选择）、表单多步骤缓存。

---

### 7. Zustand vs Context vs useReducer

| 特性           | Zustand          | Context + useReducer     |
| -------------- | ---------------- | ------------------------ |
| **写法复杂度** | 极简，十几行搞定 | 繁琐，需要 Provider 包裹 |
| **渲染精度**   | 精确到属性级别   | 整个 Context 一变全变    |
| **跨组件通信** | 随时随地 import  | 必须被 Provider 包裹     |
| **持久化**     | 官方 persist     | 手写 localStorage        |
| **适用场景**   | 全局/跨组件状态  | 组件库内部/极简局部状态  |

---

### 🐻 Zustand 记忆口诀

> `create` 建仓库，`set` 改数据
> 取值用箭头，精准不浪费
> 点击直接调，加载用 Effect
> `persist` 存硬盘，刷新也不灭

> 💪 把这些模式练熟，你就能独立开发大部分 React/Next.js 应用了！

---

## 🦊 八、Hono 后端 API 速查 (配合 Next.js)

> Hono 是一个轻量级 Web 框架，可以完美融入 Next.js，实现前端调用后端的全自动类型推断 (RPC)。

### 1. 核心路由写法 (链式调用)

**核心原则**：所有相同前缀的路由都可以链式写下去，不仅看起来清爽，也是前端 RPC 能够推断类型的关键。

```tsx
import { Hono } from "hono";

// 这里的每个 .get / .post 都是"登记"路由，只有匹配到请求的面才会执行内部逻辑
export const articleApi = new Hono()
    .get("/", async (c) => {
        // ...处理获取所有
    })
    .get("/:id", async (c) => {
        // ...处理获取单个
    })
    .post("/", async (c) => {
        // ...处理创建
    });
```

### 2. 怎么获取前端传来的数据？

| 数据来源          | Hono 用法               | 场景举例                               |
| :---------------- | :---------------------- | :------------------------------------- |
| **URL 参数**      | `c.req.param("id")`     | 获取 `/articles/123` 中的 `123`        |
| **Query 字符串**  | `c.req.query("search")` | 获取 `/articles?search=abc` 中的 `abc` |
| **请求体 Body**   | `await c.req.json()`    | 获取 POST 请求传过来的 JSON 数据       |
| **校验后的 Body** | `c.req.valid("json")`   | 使用 Zod 校验后，获取安全的数据        |

### 3. Next.js 融合模式

_在 Next.js 的 App Router 里面，需要把所有的 Hono 请求导出给 Next.js 托管。_

```tsx
// src/app/api/[[...route]]/route.ts
import { handle } from "hono/vercel";
import { app } from "@/server/main";

// 魔法：把所有的 HTTP 方法都交接给 Hono 去处理
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
```

### 4. 前端 RPC 客户端 CRUD 速查（⭐ 核心公式）

> 使用 Hono RPC 后，前端调用后端接口就像调本地函数一样，**自带 TypeScript 类型推断**，拼错字段名直接红线报错。

#### 客户端初始化（只需配置一次）

```tsx
// src/lib/hono.ts
import { hc } from "hono/client";
import { AppType } from "@/server/main";

export const client = hc<AppType>("/");
```

#### 动态路径参数的语法规则

_后端路由里的 `/:id` 占位符，在前端 RPC 里要用 `[":id"]` 中括号语法来传值。_

| 后端路由定义          | 前端 RPC 调用方式                              |
| :-------------------- | :--------------------------------------------- |
| `.get("/")`           | `client.api.articles.$get()`                   |
| `.get("/:id")`        | `client.api.articles[":id"].$get({ param: { id } })`   |
| `.post("/")`          | `client.api.articles.$post({ json: {...} })`   |
| `.put("/:id")`        | `client.api.articles[":id"].$put({ param: { id }, json: {...} })`  |
| `.delete("/:id")`     | `client.api.articles[":id"].$delete({ param: { id } })` |

#### 完整 CRUD 调用模板

```tsx
import { client } from "@/lib/hono";

// ==================== 增 Create ====================
const handleCreate = async () => {
    const res = await client.api.articles.$post({
        json: {
            title: "新文章",
            content: "",
        },
    });
    if (res.ok) {
        const data = await res.json();  // 拿到后端返回的新文章数据
        router.push(`/articles/${data.newArticle.id}`);
        router.refresh();               // 通知 Next.js 服务端重新拉数据
    }
};

// ==================== 查 Read (单个) ====================
// ⚠️ 注意：首屏加载的查询（如在 page.tsx 里），推荐直接在服务端查数据库，
//    不要走 RPC。RPC 更适合用在"用户交互触发"的场景里。
const handleFetch = async (id: string) => {
    const res = await client.api.articles[":id"].$get({
        param: { id },
    });
    if (res.ok) {
        const data = await res.json();
        console.log(data.article);
    }
};

// ==================== 改 Update ====================
const handleUpdate = async (id: string, title: string, content: string) => {
    const res = await client.api.articles[":id"].$put({
        param: { id },          // 路径参数：告诉后端改哪篇
        json: {                 // 请求体：告诉后端改成什么
            id,                 // ← 如果后端 Schema 里 json 也要求 id，别忘了带上
            title: title.trim(),
            content,
        },
    });
    if (res.ok) {
        // 更新成功后的后续操作（弹提示、刷新页面等）
        router.refresh();
    }
};

// ==================== 删 Delete ====================
const handleDelete = async (id: string) => {
    const res = await client.api.articles[":id"].$delete({
        param: { id },
    });
    if (res.ok) {
        router.push("/articles");   // 跳回列表页
        router.refresh();
    }
};
```

#### 统一的错误处理模式

```tsx
// 所有 RPC 调用都可以套用这个 try-catch 模板
try {
    const res = await client.api.articles.$post({ json: {...} });

    if (!res.ok) {
        // 后端返回了非 200 状态码（如 400 校验失败、404 找不到、500 服务器炸了）
        const error = await res.json();
        console.error("请求失败:", error);
        return;
    }

    const data = await res.json(); // ✅ 走到这里说明一切正常
} catch (error) {
    // 网络断了、服务器没启动等极端情况
    console.error("网络错误:", error);
}
```

#### 🧠 RPC vs Server Actions 选型口诀

> **首屏查数据（Read）**：直接在 `page.tsx` 服务端查数据库（最快、对 SEO 友好）
> **用户交互操作（Create / Update / Delete）**：在 `use client` 组件里用 Hono RPC 发请求
> **一句话**：读用服务端，写用 RPC

---

## 🛡️ 九、Zod 数据校验速查

> 核心思想：**不要相信前端传过来的任何数据**。在存入数据库/处理前，必须用 Zod 过一道安检。

### 1. 基础类型与修饰

```tsx
import { z } from "zod";

z.string()              // 必须是字符串
z.number()              // 必须是数字
z.boolean()             // 必须是布尔值
z.object({...})         // 必须是对象
z.array(z.string())     // 这个数组里必须全是字符串

// 常用后缀要求：
z.string().min(1, "用户名不能为空")  // 最少 1 个字符，顺便自定义报错信息
z.string().max(200, "最多200字")     // 最多 200 字符
z.string().optional()                // 可以不传（undefined 也行）
z.string().nullable()                // 可以传 null
z.coerce.number()                    // 魔法：前端传来的是字符串 "123"，自动帮你转成数字 123
```

### 2. 定义 Schema（规则表）

_我们通常会在 `schema.ts` 文件夹里集中管理定义数据的“规格表”。_

```tsx
export const createArticleSchema = z.object({
    title: z.string().min(1, "标题不能为空"),
    content: z.string().min(1, "内容不能为空"),
    // id 不需要在这里，因为往往通过 url 传过来，不通过 body 传
});
```

### 3. Zod 与 Hono 的天作之合

_在接收数据的地方装上安检门，不合规直接拦在门外并返回错误，你不需要手写任何 `if/else`。_

```tsx
import { zValidator } from "@hono/zod-validator";

// 第二个参数插上了 zValidator 安检门
.post("/", zValidator("json", createArticleSchema), async (c) => {
    // 只要能进到这里，说明数据100%是安全且符合规则的
    const { title, content } = c.req.valid("json");

    // ... 后续安全操作
})
```

---

## 📖 十、OpenAPI / Swagger / Scalar 说明书

> API 接口的“在线点菜菜单”，只要后端代码写完，自动帮你把这个测试网页给盖起来。

### 1. 三者之间的核心关系

- **OpenAPI** = **标准/图纸** 📝（就是一大段 JSON 数据，里面包含了所有接口详情，存放点例如 `/api/openapi`）。
- **Swagger UI** = **老牌看图工具** 🏗️（拿到图纸后，渲染出来的绿白黑经典风格的测试界面，老派开发者最爱）。
- **Scalar** = **最新潮的看图工具** 🏗️（拿到一模一样的图纸后，渲染出来的暗黑风格高颜值、可搜索测试界面，年轻开发者最爱）。

### 2. 标准的最小代码组装

_只要下面这段代码，你的接口项目就拥有了高级文档的门面！把这个发给别人看，非常有排面。_

```tsx
// src/server/main.ts
import { swaggerUI } from "@hono/swagger-ui";
import { Scalar } from "@scalar/hono-api-reference";

// === ① 首先提供：供渲染页面需要的 JSON 图纸数据 ===
app.get("/openapi", (c) => {
    return c.json({
        openapi: "3.0.0",
        info: { title: "IdeaFlow API", version: "1.0.0" },
    });
});

// === ② 页面 1：老派经典的 Swagger UI 链接 ===
app.get("/swagger", swaggerUI({ url: "/api/openapi" }));

// === ③ 页面 2：新潮花里胡哨的 Scalar 链接 ===
app.get("/docs", Scalar({ theme: "saturn", url: "/api/openapi" }));
```
