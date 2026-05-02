"use client";

import { useTransition } from "react";
import { DeepNonNullable } from "utility-types";
import { SignUpRequest } from "@/server/user/type";
import { useSignUpForm, useSignUpSubmit } from "../hooks";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignUpForm() {
    const form = useSignUpForm();
    const submitHandler = useSignUpSubmit();
    const [isPending, startTransition] = useTransition();

    const onSubmit = (values: SignUpRequest) => {
        startTransition(() => {
            submitHandler(values as DeepNonNullable<SignUpRequest>);
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
                            <FormLabel className="text-sm font-medium text-[#5e5448]">用户名</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="起个好听的名字（至少 3 位）"
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
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-[#5e5448]">邮箱</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
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
                                    placeholder="请输入密码（至少 6 位）"
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
                    {isPending ? "注册中..." : "免费注册"}
                </Button>
            </form>
        </Form>
    );
}
