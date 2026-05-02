import { redirect } from "next/navigation";

// /signup 已更名为 /sign-up，自动重定向兼容旧链接
export default function SignupRedirectPage() {
    redirect("/sign-up");
}
