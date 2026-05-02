# Next.js 学习指南

## 目录
- [学习路线图](#学习路线图)
- [学习计划](#学习计划)
- [环境搭建](#环境搭建)
- [项目结构](#项目结构)
- [路由系统](#路由系统)
- [页面与布局](#页面与布局)
- [服务端组件 vs 客户端组件](#服务端组件-vs-客户端组件)
- [数据获取](#数据获取)
- [Server Actions](#server-actions)
- [API 路由](#api-路由)
- [样式处理](#样式处理)
- [图片与字体优化](#图片与字体优化)
- [Metadata 与 SEO](#metadata-与-seo)
- [加载与错误处理](#加载与错误处理)
- [中间件](#中间件)
- [部署](#部署)
- [实战项目](#实战项目)
- [学习资源](#学习资源)

---

## 学习路线图

```
前置要求
└── React 基础（必须）

Week 1: 基础入门
├── 项目创建与结构
├── 路由系统
├── 页面与布局
└── 服务端/客户端组件

Week 2: 核心功能
├── 数据获取
├── Server Actions
├── API 路由
└── 样式与优化

Week 3: 进阶与实战
├── Metadata & SEO
├── 中间件
├── 部署
└── 实战项目
```

---

## 学习计划

### 前置要求检查

开始学习 Next.js 前，确保你掌握了：

- [ ] React 函数组件
- [ ] useState、useEffect
- [ ] Props 和组件通信
- [ ] 条件渲染、列表渲染
- [ ] 基本的 TypeScript

### 第一周：基础入门

| 天数 | 学习内容 | 目标 |
|------|---------|------|
| Day 1 | 创建项目 + 理解结构 | 能创建并运行 Next.js 项目 |
| Day 2 | 基础路由 | 能创建页面和嵌套路由 |
| Day 3 | 动态路由 | 能处理 /blog/[slug] 这类路由 |
| Day 4 | 布局系统 | 能创建共享布局 |
| Day 5 | 服务端 vs 客户端组件 | 理解两种组件的区别和使用场景 |
| Day 6 | 导航与链接 | 能实现页面间跳转 |
| Day 7 | 复习 + 小练习 | 做一个多页面网站 |

### 第二周：核心功能

| 天数 | 学习内容 | 目标 |
|------|---------|------|
| Day 8 | 数据获取基础 | 能在服务端组件获取数据 |
| Day 9 | 缓存与重验证 | 理解 SSG/SSR/ISR |
| Day 10 | Server Actions | 能处理表单提交 |
| Day 11 | API 路由 | 能创建后端 API |
| Day 12 | Tailwind CSS | 能使用 Tailwind 写样式 |
| Day 13 | 图片与字体优化 | 能优化图片加载 |
| Day 14 | 复习 + 练习 | 做一个带 API 的应用 |

### 第三周：进阶与实战

| 天数 | 学习内容 | 目标 |
|------|---------|------|
| Day 15 | Metadata & SEO | 能配置页面标题和 SEO |
| Day 16 | 加载和错误处理 | 能处理加载状态和错误 |
| Day 17 | 中间件 | 能实现认证、重定向 |
| Day 18-19 | 实战项目 | 开发完整应用 |
| Day 20 | 部署到 Vercel | 上线你的应用 |
| Day 21 | 总结与复习 | |

---

## 环境搭建

### 创建项目

```bash
# 推荐：使用 create-next-app
npx create-next-app@latest my-next-app

# 选项推荐：
# ✅ Would you like to use TypeScript? Yes
# ✅ Would you like to use ESLint? Yes
# ✅ Would you like to use Tailwind CSS? Yes
# ✅ Would you like to use `src/` directory? No
# ✅ Would you like to use App Router? Yes（重要！）
# ✅ Would you like to customize the default import alias? No
```

### 启动项目

```bash
cd my-next-app
npm run dev
# 打开 http://localhost:3000
```

### 常用命令

```bash
npm run dev      # 开发模式
npm run build    # 构建生产版本
npm run start    # 运行生产版本
npm run lint     # 代码检查
```

---

## 项目结构

### App Router 目录结构

```
my-next-app/
├── app/                    # 应用目录（核心）
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页 (/)
│   ├── globals.css         # 全局样式
│   ├── favicon.ico         # 网站图标
│   │
│   ├── about/              # /about 路由
│   │   └── page.tsx
│   │
│   ├── blog/               # /blog 路由
│   │   ├── page.tsx        # /blog
│   │   └── [slug]/         # 动态路由
│   │       └── page.tsx    # /blog/:slug
│   │
│   └── api/                # API 路由
│       └── hello/
│           └── route.ts    # /api/hello
│
├── components/             # 组件目录
│   ├── Header.tsx
│   └── Footer.tsx
│
├── lib/                    # 工具函数
│   └── utils.ts
│
├── public/                 # 静态资源
│   └── images/
│
├── next.config.js          # Next.js 配置
├── tailwind.config.js      # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
└── package.json
```

### 特殊文件命名

| 文件名 | 作用 |
|--------|------|
| `page.tsx` | 页面组件（必须）|
| `layout.tsx` | 布局组件 |
| `loading.tsx` | 加载状态 |
| `error.tsx` | 错误处理 |
| `not-found.tsx` | 404 页面 |
| `route.ts` | API 路由 |
| `template.tsx` | 模板（类似 layout，但每次导航都重新渲染）|

---

## 路由系统

### 基础路由

文件系统即路由：

```
app/
├── page.tsx           →  /
├── about/
│   └── page.tsx       →  /about
├── contact/
│   └── page.tsx       →  /contact
└── blog/
    └── page.tsx       →  /blog
```

### 嵌套路由

```
app/
└── dashboard/
    ├── page.tsx           →  /dashboard
    ├── settings/
    │   └── page.tsx       →  /dashboard/settings
    └── profile/
        └── page.tsx       →  /dashboard/profile
```

### 动态路由

```
app/
└── blog/
    └── [slug]/
        └── page.tsx       →  /blog/:slug
```

```tsx
// app/blog/[slug]/page.tsx
interface Props {
  params: { slug: string };
}

export default function BlogPost({ params }: Props) {
  return <h1>文章: {params.slug}</h1>;
}

// /blog/hello-world → params.slug = "hello-world"
// /blog/my-post → params.slug = "my-post"
```

### 多级动态路由

```
app/
└── shop/
    └── [category]/
        └── [productId]/
            └── page.tsx   →  /shop/:category/:productId
```

```tsx
// app/shop/[category]/[productId]/page.tsx
interface Props {
  params: { 
    category: string;
    productId: string;
  };
}

export default function Product({ params }: Props) {
  return (
    <div>
      <p>分类: {params.category}</p>
      <p>产品 ID: {params.productId}</p>
    </div>
  );
}
```

### 捕获所有路由

```
app/
└── docs/
    └── [...slug]/
        └── page.tsx       →  /docs/a/b/c/...
```

```tsx
// app/docs/[...slug]/page.tsx
interface Props {
  params: { slug: string[] };
}

export default function Docs({ params }: Props) {
  // /docs/a/b/c → params.slug = ['a', 'b', 'c']
  return <p>路径: {params.slug.join('/')}</p>;
}
```

### 路由组（不影响 URL）

```
app/
├── (marketing)/           # 不会出现在 URL 中
│   ├── about/
│   │   └── page.tsx       →  /about
│   └── contact/
│       └── page.tsx       →  /contact
│
└── (dashboard)/
    ├── layout.tsx         # dashboard 专用布局
    └── settings/
        └── page.tsx       →  /settings
```

### 平行路由

```
app/
└── @modal/                # 插槽
    └── login/
        └── page.tsx
```

---

## 页面与布局

### 基本页面

```tsx
// app/page.tsx
export default function Home() {
  return (
    <main>
      <h1>欢迎来到我的网站</h1>
      <p>这是首页内容</p>
    </main>
  );
}
```

### 根布局

```tsx
// app/layout.tsx
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <header>
          <nav>导航栏</nav>
        </header>
        
        <main>{children}</main>
        
        <footer>页脚</footer>
      </body>
    </html>
  );
}
```

### 嵌套布局

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <aside>侧边栏</aside>
      <main>{children}</main>
    </div>
  );
}

// 现在 /dashboard/* 的所有页面都会有侧边栏
```

### 页面导航

```tsx
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      {/* 基本链接 */}
      <Link href="/">首页</Link>
      <Link href="/about">关于</Link>
      <Link href="/blog">博客</Link>
      
      {/* 动态链接 */}
      <Link href={`/blog/${post.slug}`}>阅读更多</Link>
      
      {/* 带样式 */}
      <Link href="/contact" className="btn">
        联系我们
      </Link>
    </nav>
  );
}
```

### 编程式导航

```tsx
'use client';

import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const router = useRouter();
  
  const handleLogin = async () => {
    // 登录逻辑...
    
    // 跳转
    router.push('/dashboard');
    
    // 其他方法
    // router.replace('/dashboard');  // 替换（不能后退）
    // router.back();                  // 后退
    // router.forward();               // 前进
    // router.refresh();               // 刷新
  };
  
  return <button onClick={handleLogin}>登录</button>;
}
```

### 获取当前路径

```tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';

export default function CurrentPath() {
  const pathname = usePathname();        // /blog/hello
  const searchParams = useSearchParams(); // ?page=1&sort=date
  
  const page = searchParams.get('page'); // "1"
  
  return (
    <div>
      <p>当前路径: {pathname}</p>
      <p>页码: {page}</p>
    </div>
  );
}
```

---

## 服务端组件 vs 客户端组件

### 默认是服务端组件

```tsx
// app/page.tsx - 服务端组件（默认）
async function getData() {
  const res = await fetch('https://api.example.com/data');
  return res.json();
}

export default async function Page() {
  const data = await getData();
  
  return <div>{data.title}</div>;
}
```

### 客户端组件

```tsx
// 必须在文件顶部声明 'use client'
'use client';

import { useState, useEffect } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

### 对比

| 特性 | 服务端组件 | 客户端组件 |
|------|-----------|-----------|
| 声明方式 | 默认 | `'use client'` |
| 运行位置 | 服务器 | 浏览器 |
| useState | ❌ | ✅ |
| useEffect | ❌ | ✅ |
| onClick 等事件 | ❌ | ✅ |
| 直接访问数据库 | ✅ | ❌ |
| 访问后端资源 | ✅ | ❌ |
| 敏感信息（API Key）| ✅ 安全 | ❌ 不安全 |
| 减少 JS 包体积 | ✅ | ❌ |
| SEO | ✅ 好 | 需要处理 |

### 使用原则

```
默认使用服务端组件
     ↓
需要交互时（useState、onClick）才用客户端组件
     ↓
客户端组件放在组件树的叶子节点
```

### 混合使用

```tsx
// app/page.tsx (服务端组件)
import Counter from '@/components/Counter'; // 客户端组件

async function getData() {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function Page() {
  const posts = await getData(); // 服务端获取数据
  
  return (
    <div>
      <h1>文章列表</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
      
      {/* 客户端组件用于交互 */}
      <Counter />
    </div>
  );
}
```

```tsx
// components/Counter.tsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      点击次数: {count}
    </button>
  );
}
```

---

## 数据获取

### 服务端组件中获取数据

```tsx
// app/posts/page.tsx
interface Post {
  id: number;
  title: string;
  body: string;
}

async function getPosts(): Promise<Post[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts');
  
  if (!res.ok) {
    throw new Error('获取数据失败');
  }
  
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  
  return (
    <div>
      <h1>文章列表</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 缓存策略

```tsx
// 1. 默认：缓存数据（SSG）
const res = await fetch('https://api.example.com/data');

// 2. 不缓存：每次请求都获取新数据（SSR）
const res = await fetch('https://api.example.com/data', {
  cache: 'no-store'
});

// 3. 增量静态再生成（ISR）：定时重新验证
const res = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }  // 60秒后重新获取
});

// 4. 按标签重新验证
const res = await fetch('https://api.example.com/data', {
  next: { tags: ['posts'] }
});
// 然后用 revalidateTag('posts') 触发更新
```

### 页面级别配置

```tsx
// app/posts/page.tsx

// 强制动态渲染（SSR）
export const dynamic = 'force-dynamic';

// 强制静态渲染（SSG）
export const dynamic = 'force-static';

// 设置重新验证时间（ISR）
export const revalidate = 60;
```

### 并行数据获取

```tsx
async function Page() {
  // ❌ 串行（慢）
  // const user = await getUser();
  // const posts = await getPosts();
  
  // ✅ 并行（快）
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts()
  ]);
  
  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
    </div>
  );
}
```

### 客户端数据获取

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function ClientDataFetch() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <p>加载中...</p>;
  
  return <div>{JSON.stringify(data)}</div>;
}
```

### 使用 SWR（推荐）

```tsx
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);
  
  if (isLoading) return <p>加载中...</p>;
  if (error) return <p>加载失败</p>;
  
  return <div>Hello, {data.name}</div>;
}
```

---

## Server Actions

Server Actions 让你可以在服务端执行函数，非常适合处理表单。

### 基本用法

```tsx
// app/actions.ts
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  // 保存到数据库
  await db.post.create({
    data: { title, content }
  });
  
  // 重新验证页面数据
  revalidatePath('/posts');
}
```

```tsx
// app/posts/new/page.tsx
import { createPost } from '../actions';

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />
      <button type="submit">发布</button>
    </form>
  );
}
```

### 带验证的表单

```tsx
// app/actions.ts
'use server';

import { z } from 'zod';

const PostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100),
  content: z.string().min(10, '内容至少10个字符'),
});

export async function createPost(formData: FormData) {
  const validatedFields = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  // 保存到数据库...
}
```

### 使用 useFormState

```tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createPost } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

export default function PostForm() {
  const [state, formAction] = useFormState(createPost, { errors: {} });
  
  return (
    <form action={formAction}>
      <div>
        <input name="title" placeholder="标题" />
        {state.errors?.title && <p>{state.errors.title}</p>}
      </div>
      <div>
        <textarea name="content" placeholder="内容" />
        {state.errors?.content && <p>{state.errors.content}</p>}
      </div>
      <SubmitButton />
    </form>
  );
}
```

### 非表单使用

```tsx
'use client';

import { deletePost } from './actions';

export default function DeleteButton({ postId }: { postId: number }) {
  return (
    <button onClick={() => deletePost(postId)}>
      删除
    </button>
  );
}
```

```tsx
// actions.ts
'use server';

export async function deletePost(postId: number) {
  await db.post.delete({ where: { id: postId } });
  revalidatePath('/posts');
}
```

---

## API 路由

### 基本 API

```tsx
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello, World!' });
}
```

### CRUD API

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/posts
export async function GET() {
  const posts = await db.post.findMany();
  return NextResponse.json(posts);
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const post = await db.post.create({
    data: body
  });
  
  return NextResponse.json(post, { status: 201 });
}
```

```tsx
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: { id: string };
}

// GET /api/posts/:id
export async function GET(request: NextRequest, { params }: Params) {
  const post = await db.post.findUnique({
    where: { id: parseInt(params.id) }
  });
  
  if (!post) {
    return NextResponse.json(
      { error: '文章不存在' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(post);
}

// PUT /api/posts/:id
export async function PUT(request: NextRequest, { params }: Params) {
  const body = await request.json();
  
  const post = await db.post.update({
    where: { id: parseInt(params.id) },
    data: body
  });
  
  return NextResponse.json(post);
}

// DELETE /api/posts/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  await db.post.delete({
    where: { id: parseInt(params.id) }
  });
  
  return NextResponse.json({ success: true });
}
```

### 获取请求参数

```tsx
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 查询参数 /api/search?q=hello&page=1
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const page = searchParams.get('page');
  
  // 请求头
  const authHeader = request.headers.get('authorization');
  
  // Cookies
  const token = request.cookies.get('token');
  
  return NextResponse.json({ query, page });
}
```

### 设置响应头和 Cookie

```tsx
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // 设置响应头
  response.headers.set('X-Custom-Header', 'value');
  
  // 设置 Cookie
  response.cookies.set('token', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7 // 7天
  });
  
  return response;
}
```

---

## 样式处理

### 全局样式

```css
/* app/globals.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
}
```

```tsx
// app/layout.tsx
import './globals.css';
```

### CSS Modules

```css
/* components/Button.module.css */
.button {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.primary {
  background: #0070f3;
  color: white;
}

.secondary {
  background: #eaeaea;
  color: #333;
}
```

```tsx
// components/Button.tsx
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

### Tailwind CSS（推荐）

```tsx
// 已在创建项目时配置
export default function Card() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        标题
      </h2>
      <p className="text-gray-600">
        内容描述
      </p>
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        了解更多
      </button>
    </div>
  );
}
```

### 条件类名

```tsx
// 使用 clsx 或 cn
import { clsx } from 'clsx';

function Button({ isActive, isDisabled }) {
  return (
    <button 
      className={clsx(
        'px-4 py-2 rounded',
        isActive && 'bg-blue-500 text-white',
        isDisabled && 'opacity-50 cursor-not-allowed',
        !isActive && !isDisabled && 'bg-gray-200'
      )}
    >
      按钮
    </button>
  );
}
```

---

## 图片与字体优化

### Image 组件

```tsx
import Image from 'next/image';

export default function Gallery() {
  return (
    <div>
      {/* 本地图片（推荐） */}
      <Image
        src="/images/hero.jpg"
        alt="Hero Image"
        width={800}
        height={400}
        priority  // 首屏图片加 priority
      />
      
      {/* 远程图片 */}
      <Image
        src="https://example.com/image.jpg"
        alt="Remote Image"
        width={400}
        height={300}
      />
      
      {/* 填充容器 */}
      <div className="relative w-full h-64">
        <Image
          src="/images/cover.jpg"
          alt="Cover"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}
```

### 配置远程图片域名

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
};
```

### 字体优化

```tsx
// app/layout.tsx
import { Inter, Noto_Sans_SC } from 'next/font/google';

// 英文字体
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// 中文字体
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

```css
/* tailwind.config.js */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-noto)', 'var(--font-inter)', 'system-ui'],
      },
    },
  },
};
```

---

## Metadata 与 SEO

### 静态 Metadata

```tsx
// app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '首页 | My Website',
  description: '这是网站首页的描述',
  keywords: ['Next.js', 'React', 'Web开发'],
  authors: [{ name: '作者名' }],
  openGraph: {
    title: '首页 | My Website',
    description: '这是网站首页的描述',
    images: ['/og-image.jpg'],
  },
};

export default function Home() {
  return <h1>首页</h1>;
}
```

### 动态 Metadata

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  
  return {
    title: `${post.title} | Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}
```

### 全局 Metadata

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'My Website',
    template: '%s | My Website', // 子页面会用这个模板
  },
  description: '网站默认描述',
  metadataBase: new URL('https://mywebsite.com'),
};
```

### Sitemap 和 Robots

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://mywebsite.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://mywebsite.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
```

```tsx
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: 'https://mywebsite.com/sitemap.xml',
  };
}
```

---

## 加载与错误处理

### Loading 状态

```tsx
// app/posts/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}
```

### 骨架屏

```tsx
// app/posts/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

### Error 处理

```tsx
// app/posts/error.tsx
'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        出错了！
      </h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        重试
      </button>
    </div>
  );
}
```

### 全局错误处理

```tsx
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

### Not Found 页面

```tsx
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">页面不存在</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        返回首页
      </Link>
    </div>
  );
}
```

### 手动触发 Not Found

```tsx
import { notFound } from 'next/navigation';

async function getPost(slug: string) {
  const post = await db.post.findUnique({ where: { slug } });
  
  if (!post) {
    notFound(); // 跳转到 not-found.tsx
  }
  
  return post;
}
```

---

## 中间件

### 基本中间件

```tsx
// middleware.ts（项目根目录）
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('请求路径:', request.nextUrl.pathname);
  
  // 继续处理
  return NextResponse.next();
}

// 配置匹配路径
export const config = {
  matcher: [
    // 匹配所有路径，除了静态资源
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 认证保护

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard');
  
  // 未登录访问受保护页面 → 跳转登录
  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 已登录访问登录页 → 跳转首页
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

### 添加响应头

```tsx
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 添加安全头
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}
```

### URL 重写

```tsx
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // /old-path → /new-path
  if (pathname === '/old-path') {
    return NextResponse.redirect(new URL('/new-path', request.url));
  }
  
  // 重写（URL 不变，但渲染不同页面）
  if (pathname === '/api/proxy') {
    return NextResponse.rewrite(new URL('https://api.example.com', request.url));
  }
  
  return NextResponse.next();
}
```

---

## 部署

### 部署到 Vercel（推荐）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 生产部署
vercel --prod
```

### 环境变量

```bash
# .env.local（本地开发）
DATABASE_URL=postgresql://...
API_KEY=your-api-key

# .env.production（生产环境）
# 在 Vercel Dashboard 中设置
```

```tsx
// 使用环境变量
const apiKey = process.env.API_KEY;

// 客户端使用（需要 NEXT_PUBLIC_ 前缀）
const publicKey = process.env.NEXT_PUBLIC_ANALYTICS_ID;
```

### 静态导出

```js
// next.config.js
module.exports = {
  output: 'export',
};
```

```bash
npm run build
# 输出到 out/ 目录，可部署到任何静态托管
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```js
// next.config.js
module.exports = {
  output: 'standalone',
};
```

---

## 实战项目

### 项目一：个人博客

功能：
- 首页展示文章列表
- 文章详情页
- Markdown 渲染
- 标签分类
- SEO 优化

技术栈：
- Next.js + TypeScript
- Tailwind CSS
- MDX（Markdown）
- Vercel 部署

### 项目二：Todo 应用

功能：
- 任务 CRUD
- 任务状态切换
- 本地存储
- 服务端操作（Server Actions）

```tsx
// 简化版 Todo
'use server';

export async function addTodo(formData: FormData) {
  const title = formData.get('title') as string;
  await db.todo.create({ data: { title, completed: false } });
  revalidatePath('/todos');
}

export async function toggleTodo(id: number) {
  const todo = await db.todo.findUnique({ where: { id } });
  await db.todo.update({
    where: { id },
    data: { completed: !todo?.completed }
  });
  revalidatePath('/todos');
}
```

### 项目三：电商网站

功能：
- 商品列表和详情
- 购物车
- 用户认证
- 订单管理

技术栈：
- Next.js + TypeScript
- Prisma（数据库 ORM）
- NextAuth.js（认证）
- Stripe（支付）

---

## 学习资源

### 官方资源

| 资源 | 说明 |
|------|------|
| [nextjs.org/docs](https://nextjs.org/docs) | 官方文档 ⭐ |
| [nextjs.org/learn](https://nextjs.org/learn) | 官方教程 ⭐ |
| [GitHub Examples](https://github.com/vercel/next.js/tree/canary/examples) | 官方示例 |

### 视频教程

| 资源 | 说明 |
|------|------|
| Vercel YouTube | 官方视频 |
| B站 "Next.js 14" | 中文教程 |

### 推荐学习顺序

1. ✅ 完成 React 基础学习
2. ✅ 阅读 Next.js 官方文档
3. ✅ 完成 nextjs.org/learn 教程
4. ✅ 做一个博客项目
5. ✅ 部署到 Vercel
6. ✅ 做更复杂的项目

---

## 常见问题

### 1. 什么时候用服务端组件？

```
默认使用服务端组件
需要 useState、onClick 等才用客户端组件
```

### 2. App Router vs Pages Router？

```
新项目用 App Router（本文档内容）
旧项目可能还在用 Pages Router
```

### 3. 如何处理表单？

```
推荐使用 Server Actions
不需要额外的 API 路由
```

### 4. 如何做认证？

```
推荐使用 NextAuth.js (Auth.js)
支持多种认证方式
```

---

## 总结

### 学完本文档你应该掌握

- [x] 创建和配置 Next.js 项目
- [x] 文件系统路由
- [x] 服务端和客户端组件
- [x] 数据获取和缓存策略
- [x] Server Actions 表单处理
- [x] API 路由
- [x] 样式处理（Tailwind）
- [x] 图片和字体优化
- [x] Metadata 和 SEO
- [x] 错误和加载处理
- [x] 中间件
- [x] 部署到 Vercel

### 下一步学习

- [ ] 数据库集成（Prisma）
- [ ] 用户认证（NextAuth.js）
- [ ] 状态管理（Zustand）
- [ ] 测试（Jest、Playwright）
- [ ] 国际化（next-intl）

---

> 📚 参考：[Next.js 官方文档](https://nextjs.org/docs)

