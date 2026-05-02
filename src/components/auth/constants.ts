import { createContext } from "react";
import type { AuthContextType } from "./types";
// 创建全局上下文，设置默认值为“未登录”状态
export const AuthContext = createContext<AuthContextType>({
    auth: null,
    setAuth: () => {},
});
