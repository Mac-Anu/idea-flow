import { describe, it, expect } from "vitest";
import {
    stripHtml,
    formatDate,
    estimateReadTime,
    collectTags,
} from "@/lib/article";

describe("stripHtml", () => {
    it("移除所有 HTML 标签", () => {
        expect(stripHtml("<p>Hello <strong>World</strong></p>")).toBe("Hello World");
    });

    it("将 &nbsp; 转为空格", () => {
        expect(stripHtml("a&nbsp;b")).toBe("a b");
    });

    it("修剪首尾空白", () => {
        expect(stripHtml("  <span>x</span>  ")).toBe("x");
    });

    it("纯文本原样返回", () => {
        expect(stripHtml("plain text")).toBe("plain text");
    });
});

describe("formatDate", () => {
    it("null/undefined 返回「未知时间」", () => {
        expect(formatDate(null)).toBe("未知时间");
        expect(formatDate(undefined)).toBe("未知时间");
    });

    it("将 ISO 字符串格式化为中文日期", () => {
        // 用 UTC 正午避免时区导致跨日
        expect(formatDate("2026-05-17T12:00:00Z")).toContain("2026");
        expect(formatDate("2026-05-17T12:00:00Z")).toContain("5");
    });

    it("接受 Date 对象", () => {
        const result = formatDate(new Date("2026-01-01T12:00:00Z"));
        expect(result).toContain("2026");
    });
});

describe("estimateReadTime", () => {
    it("最少返回 1 分钟", () => {
        expect(estimateReadTime("")).toBe(1);
        expect(estimateReadTime("短")).toBe(1);
    });

    it("按 400 字/分钟向上取整", () => {
        expect(estimateReadTime("字".repeat(400))).toBe(1);
        expect(estimateReadTime("字".repeat(401))).toBe(2);
        expect(estimateReadTime("字".repeat(800))).toBe(2);
    });

    it("先剥离 HTML 再计算字数", () => {
        const html = `<p>${"字".repeat(400)}</p>`;
        expect(estimateReadTime(html)).toBe(1);
    });
});

describe("collectTags", () => {
    it("空数组返回空结果", () => {
        expect(collectTags([])).toEqual([]);
    });

    it("统计标签出现次数", () => {
        const articles = [
            { tags: ["ai", "web"] },
            { tags: ["ai"] },
        ];
        const result = collectTags(articles);
        expect(result).toContainEqual({ name: "ai", count: 2 });
        expect(result).toContainEqual({ name: "web", count: 1 });
    });

    it("按出现次数降序排列", () => {
        const articles = [
            { tags: ["a"] },
            { tags: ["b"] },
            { tags: ["b"] },
            { tags: ["b"] },
        ];
        const result = collectTags(articles);
        expect(result[0]).toEqual({ name: "b", count: 3 });
    });

    it("忽略缺失或非数组的 tags 字段", () => {
        const articles = [{ tags: ["x"] }, {}, { tags: null }, { tags: "notarray" }];
        const result = collectTags(articles);
        expect(result).toEqual([{ name: "x", count: 1 }]);
    });
});
