import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import deepmerge from "deepmerge";
import { lowerCase, trim } from "lodash";
import pinyin from "pinyin";

/**
 * Tailwind CSS 类名合并工具函数
 * 解决条件渲染时的类名冲突问题（例如："p-4 p-8" 会被智能合并为 "p-8"）
 * 
 * @param inputs - 接受多个类名字符串、对象或数组形式的 Tailwind 类名
 * @returns 经过处理后无冲突的、标准化的 class 字符串
 */

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
/**
 * 对象的深度合并工具函数 (Deep Merge)
 * 递归合并两个对象的属性，常用于处理默认配置项与用户配置项的融合
 * 
 * @param x - 基础对象 (Initial configuration)
 * @param y - 覆盖对象 (Overrides configuration)
 * @param arrayMode - 处理数组冲突时的策略:
 *                    "replace" = 直接用新数组覆盖旧数组；
 *                    "merge" = 合并两个数组并去重
 * @returns 深度合并后的全新对象
 */
export const deepMerge = <T1, T2>(
    x: Partial<T1>,
    y: Partial<T2>,
    arrayMode: "replace" | "merge" = "merge",
) => {
    const options: deepmerge.Options = {};
    if (arrayMode === "replace") {
        options.arrayMerge = (_d, s, _o) => s;
    } else if (arrayMode === "merge") {
        options.arrayMerge = (_d, s, _o) => Array.from(new Set([..._d, ...s]));
    }
    return deepmerge(x, y, options) as T2 extends T1 ? T1 : T1 & T2;
};

/**
 * 生成符合 URL 规范的小写连字符别名 (Slugify)
 * 处理逻辑: 将汉字转换为拼音首字母，英文字母全转小写，并用中划线 ("-") 替换所有空格
 * 常用于从文章标题自动生成友好的 SEO URL (例如: "我的 React 笔记" -> "w-d-react-b-j")
 * 
 * @param from - 原始字符串内容 (支持中英文混排)
 * @returns 格式化后的 URL Slug 字符串
 */
export const generateLowerString = (from: string) => {
    const slug = pinyin(from, {
        style: 0,
        segment: false,
    })
        .map((words) => words[0])
        .join("-");
    return lowerCase(slug)
        .split(" ")
        .map((v) => trim(v, " "))
        .join("-");
};
