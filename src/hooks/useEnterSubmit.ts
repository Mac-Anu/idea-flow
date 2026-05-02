import { useEffect, RefObject } from "react";

/**
 * Enter 键提交 Hook
 * 当指定元素聚焦时，按 Enter 键触发提交函数
 * 
 * @param ref - 要监听的元素引用
 * @param onSubmit - 按 Enter 时调用的函数
 * @param enabled - 是否启用（可选，默认 true）
 * 
 * @example
 * const inputRef = useRef<HTMLInputElement>(null);
 * useEnterSubmit(inputRef, handleSubmit);
 */
export function useEnterSubmit(
    ref: RefObject<HTMLElement | null>,
    onSubmit: () => void,
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // 只有当目标元素聚焦时才触发
            if (document.activeElement === ref.current) {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [ref, onSubmit, enabled]);
}
