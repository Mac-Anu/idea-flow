import { getTechIcon, techColorHue } from "./tech-icons";

/**
 * 单个技术栈徽章。
 * 有 simple-icons 图标的：显示品牌色 SVG 图标 + 名称。
 * 没有图标的：降级为带稳定色边框的纯文字 badge（同名每次同色）。
 *
 * @param name - 技术名称（如 "TypeScript"、"自研框架"）
 * @param size - 图标尺寸，默认 14
 */
export function TechBadge({ name, size = 14 }: { name: string; size?: number }) {
    const icon = getTechIcon(name);

    if (icon) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-xs font-medium text-foreground">
                <svg
                    role="img"
                    viewBox="0 0 24 24"
                    width={size}
                    height={size}
                    fill={`#${icon.hex}`}
                    className="shrink-0"
                    aria-hidden
                >
                    <path d={icon.path} />
                </svg>
                {name}
            </span>
        );
    }

    // 降级：纯文字 badge，颜色由名称哈希得到，保证同名稳定同色
    const hue = techColorHue(name);
    return (
        <span
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{
                color: `hsl(${hue} 65% 45%)`,
                borderColor: `hsl(${hue} 50% 50% / 0.35)`,
                backgroundColor: `hsl(${hue} 60% 50% / 0.08)`,
            }}
        >
            {name}
        </span>
    );
}

/**
 * 技术栈徽章列表（自动换行）。
 *
 * @param items - 技术名称数组
 * @param size - 图标尺寸
 */
export function TechBadgeList({ items, size }: { items?: string[] | null; size?: number }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((t) => (
                <TechBadge key={t} name={t} size={size} />
            ))}
        </div>
    );
}
