import { useRef, useEffect } from "react";

/**
 * 自动聚焦 Hook
 * 页面加载后自动将焦点放到指定元素上
 * 
 * @example
 * const inputRef = useAutoFocus<HTMLInputElement>();
 * <input ref={inputRef} />
 */
export function useAutoFocus<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        ref.current?.focus();
    }, []);

    return ref;
}
