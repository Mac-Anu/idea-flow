import type { User } from "@/server/user/type"; // 这里的具体引入路径依你项目为准
// AuthContext 提供出去的数据长什么样
export interface AuthContextType {
    auth: User | null; // 要么有用户信息，要么是 null (未登录)
    setAuth: (value: User | null) => void; // 一个可以更改全局身份的方法
}
