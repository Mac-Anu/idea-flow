import { redirect } from "next/navigation";

// /login 已更名为 /sign-in，自动重定向兼容旧链接
export default function LoginRedirectPage() {
    redirect("/sign-in");
}
