import { useState, ChangeEvent } from "react";

/**
 * 输入框状态管理 Hook
 * 封装了输入框常用的 value、onChange、clear 逻辑
 * 
 * @example
 * const { value, onChange, clear } = useInput();
 * <input value={value} onChange={onChange} />
 * // 提交后清空: clear();
 */
export function useInput(initialValue = "") {
    const [value, setValue] = useState(initialValue);

    const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValue(e.target.value);
    };

    const clear = () => setValue("");

    const reset = () => setValue(initialValue);

    return {
        value,
        setValue,
        onChange,
        clear,
        reset,
        // 便捷属性，可以直接展开到 input 上
        inputProps: { value, onChange }
    };
}
