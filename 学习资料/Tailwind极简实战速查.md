# Tailwind CSS 极简实战速查手册

既然你已经懂了 CSS 的“心法”，那 Tailwind 就像是一把极简的瑞士军刀。在没有 AI 的时候，只要掌握以下这套极其规律的“命名词根”，你自己也能盲打排版！

---

## 📐 一、尺寸与留白法则 (四大天王：w, h, p, m)

Tailwind 的尺寸数字有一个全球通用的公式：**1 = 4px**。
也就是说 `1` 是 4 像素， `4` 是 16 像素，`8` 是 32 像素...以此类推你甚至能口算得出像素值！

- **宽度与高度 (W/H)**
  - 固定值：`w-4` (16px)、`h-8` (32px)、`w-12` (48px)
  - 终极占满符：`w-full` (100%父容器宽度)、`w-screen` (100%整个屏幕宽)、`h-screen` (整个屏幕高)
  - 💡 *不知道填什么数字？直接按 `[数值]` 写强行覆盖！例如：`w-[342px]`*

- **内边距与外边距 (P/M)**
  - 控制四周：`p-4` / `m-4` (上下左右全加)
  - 控制 X 轴 (横向)：`px-4` / `mx-4` (只加左右)
  - 控制 Y 轴 (纵向)：`py-4` / `my-4` (只加上下)
  - 单边：`pt-4` (仅上 Top), `pb` (下 Bottom), `pl` (左 Left), `pr` (右 Right)
  - 黄金居中法：`mx-auto` (块级元素左右外边距自动 ＝ 水平居中居中)

---

## ✍️ 二、文字与排版 (Text & Font)

不用再去写繁复的 font-size、color，一切就三招。

- **大小**：`text-xs` (超小), `text-sm` (小), `text-base` (中/常规), `text-lg` (大), `text-xl` (特大), 一直到 `text-9xl`。
- **粗细**：`font-light` (细), `font-normal` (常规), `font-bold` (加粗), `font-extrabold` (特粗)。
- **颜色**：`text-blue-500`。
  - *Tailwind 的颜色有段位：50 是极淡，500 是中等的主色，900 是极深。*
  - *系统色：`text-transparent` (透明色做渐变时用)，`text-stone-600` (你项目里常用的高级灰).*
- **对齐**：`text-left` (靠左), `text-center` (居中), `text-right` (靠右)。

---

## 🎨 三、颜值三板斧：背景、边框、圆角

这是让一个难看的组件瞬间变“高级”的万金油：

1. **背景颜色**：`bg-white`、 `bg-rose-500`、 `bg-zinc-900/50` (斜杠后面代表 50% 透明度！)
2. **切个圆角**：`rounded` (极不明显), `rounded-md` (常用适中), `rounded-xl` (大圆角), `rounded-full` (彻底变成药丸或者正圆形！做头像必备)。
3. **加点阴影**：`shadow-sm` (极淡的边缝立面), `shadow-md` (高级悬浮感), `shadow-2xl` (飞到天上的巨影)。
4. **加个边框**：先写 `border` (声明只要 1px 宽)，再写 `border-gray-200` (上色)。

---

## ⚡ 四、魔幻后缀机制 (状态 & 响应式) ⭐

这是 Tailwind 能干掉一万行 CSS 的“核心竞争力”。想要变色、想要响应手机端？只需加个**带冒号的前缀**！

### 1. 鼠标悬停 / 点击状态
- **`hover:bg-gray-100`**：平时没有背景色，当鼠标放上去时，瞬间变成浅灰背景。（写按钮互动必备）
- **`focus:ring-2`**：当用户点中这个输入框输入账号时，高亮边框。

### 2. 黑白模式自动切换
- **`dark:bg-slate-900`**：白天我是正常的背景色，但如果页面外面出现了 `class="dark"`，我就强行变成黑的。

### 3. 一次搞定手机端、iPad端、电脑端 (响应式断点)
Tailwind 是**手机端优先**的机制！也就是你不写前缀，默认是在手机上显示的样子。

假设你要做一排卡片：如果在手机上它需要“一排塞 1 个”，在 iPad 上“一排塞 2 个”，电脑上“一排塞 3 个”怎么办？
只需在一行里写完：
`w-full sm:w-1/2 lg:w-1/3`
- `w-full`：默认手机屏上横向霸占全屏 100%。
- `sm:`：当屏幕像 iPad 一样大时，变成 50% 宽。
- `lg:`：当屏幕像大电脑一样大时，缩成 33% 宽。

---

## 🔫 总结：写一个现代按钮的真实思路重演

假设此时此刻你想手写一个非常漂亮的“提交按钮”，你在键盘上的思路会是这样：

1. 我要一个内边距正常的盒子 ➔ `px-4 py-2`
2. 它是蓝色的框，字是白色的且加粗 ➔ `bg-blue-600 text-white font-bold`
3. 现代网站都要大圆角才好看，还得带点阴影 ➔ `rounded-xl shadow-md`
4. 鼠标放上去时，变成深蓝色给用户反馈 ➔ `hover:bg-blue-700`
5. 用上万能排版术 ➔ `flex items-center justify-center gap-2` (方便左边放个 Icon，右边放个“提交”字样)

最终连起来：
`<button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 flex items-center justify-center gap-2">提交</button>`

不需要任何魔法，只是把你想到的词组拼起来！建议以后遇到排版，先自己试着用这些词根盲拼一次，实在想不出了再问 AI。

---

## 🔮 五、进阶操作：在原生 CSS 中“吸入” Tailwind (@apply 魔法)

当你遇到长长一串类名，或者需要在特定条件下（比如你的全局布局底座）写样式，又不想把 React 组件 (`.tsx`) 搞得又臭又长时，这就是你必须掌握的绝招。

### 1. 使用 `@apply` 打包压缩
在任何纯 CSS 文件（最常见的是 `.module.css`）中，你可以直接使用 `@apply` 吞噬并翻译 Tailwind 的缩写，将它们打包成一个单独的 CSS 类。

```css
/* button.module.css */
.my-custom-btn {
  /* 原生 CSS 与 Tailwind 的完美结合 */
  @apply px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md;
  
  /* 在 @apply 后面，你依然可以写任何你想写的变态原生 CSS */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
  backdrop-filter: blur(10px);
}
```

然后在你的 `.tsx` 页面里，引入并使用它，瞬间清爽：
```tsx
import styles from './button.module.css';

<button className={styles["my-custom-btn"]}>提交</button>
```

### 2. (Tailwind V4 必看) 给 CSS 文件“请神”的 `@reference`
如果你在普通的 `.css` 文件里写完 `@apply` 发现完全没生效，说明编译器由于性能保护机制，并没有主动扫描这个文件是否想要用 Tailwind。

这时候，在你的 CSS 文件的**最顶部第一行**加上这句：
```css
@reference "#tailwind.css"; /* 有的项目路径可能是 "../globals.css" 等基础配置文件 */

.layout {
    @apply min-h-screen bg-stone-200/80;
}
```
这句指令就是在“引渡” Tailwind 的基础变量集合。它告诉系统：“嘿！接下来的代码里会有我要用到你 Tailwind 能力的各种缩写，请立刻帮我翻译并加持！”
