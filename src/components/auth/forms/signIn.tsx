"use client";

import { useTransition } from "react";
import { useSignInForm, useSignInSubmit } from "../hooks";
import { DeepNonNullable } from "utility-types";
import { SignInRequest } from "@/server/user/type";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignInForm() {
    const form = useSignInForm();
    const submitHandler = useSignInSubmit();
    const [isPending, startTransition] = useTransition();

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

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-[#1f1d1a] hover:bg-[#3a342e] text-white rounded-xl shadow-sm h-11 font-medium transition-colors mt-2"
                >
                    {isPending ? "登录中..." : "立即登录"}
                </Button>
            </form>
        </Form>
    );
}
