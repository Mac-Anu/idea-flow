"use client";

import { useTransition, Suspense, useMemo, FC } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSignInForm, useSignInSubmit } from "../hooks";
import { DeepNonNullable } from "utility-types";
import { SignInRequest } from "@/server/user/type";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFormSkeleton } from "../skeleton";

function FormComponent() {
    const form = useSignInForm();
    const submitHandler = useSignInSubmit();
    const [isPending, startTransition] = useTransition();
    const searchParams = useSearchParams();

    const signupUrl = useMemo(() => {
        let url = '/sign-up';
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
            params.set(key, value);
        });

        if (params.toString()) url += `?${params.toString()}`;

        return url;
    }, [searchParams]);

    const onSubmit = (values: SignInRequest) => {
        startTransition(() => {
            submitHandler(values as DeepNonNullable<SignInRequest>);
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-[#5e5448]">账号 / 邮箱</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="请输入您的用户名或邮箱"
                                    className="bg-[#fdfaf5] border-black/5 focus-visible:ring-[#c8a96e] focus-visible:border-[#dec9a0] rounded-xl h-11 text-[#1f1d1a] placeholder:text-[#c7b9a5]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-[#5e5448]">密码</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="请输入密码"
                                    className="bg-[#fdfaf5] border-black/5 focus-visible:ring-[#c8a96e] focus-visible:border-[#dec9a0] rounded-xl h-11 text-[#1f1d1a] placeholder:text-[#c7b9a5]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Link
                        href="/forget-password"
                        className="text-sm text-[#c8a96e] hover:text-[#b0925c] transition-colors"
                    >
                        忘记密码？
                    </Link>
                </div>

                <div className="space-y-3 pt-2">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-[#1f1d1a] hover:bg-[#3a342e] text-white rounded-xl shadow-sm h-11 font-medium transition-colors"
                    >
                        {isPending ? "登录中..." : "立即登录"}
                    </Button>
                    <Button 
                        asChild 
                        variant="outline"
                        className="w-full rounded-xl h-11 font-medium border-[#c8a96e]/30 text-[#5e5448] hover:bg-[#fdfaf5] hover:text-[#3a342e]"
                    >
                        <Link href={signupUrl}>前往注册</Link>
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export const SignInForm: FC = () => (
    <Suspense fallback={<AuthFormSkeleton />}>
        <FormComponent />
    </Suspense>
);
