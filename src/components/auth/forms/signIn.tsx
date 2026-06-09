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
                            <FormLabel className="text-sm font-medium text-foreground/70">账号 / 邮箱</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="请输入您的用户名或邮箱"
                                    className="bg-background border-border focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-11 text-foreground placeholder:text-foreground/30"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-destructive" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/70">密码</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="请输入密码"
                                    className="bg-background border-border focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-11 text-foreground placeholder:text-foreground/30"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-destructive" />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Link
                        href="/forget-password"
                        className="text-sm text-primary/70 hover:text-primary transition-colors"
                    >
                        忘记密码？
                    </Link>
                </div>

                <div className="space-y-3 pt-2">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-primary hover:brightness-110 text-primary-foreground rounded-xl shadow-[0_4px_20px_oklch(0.7_0.19_40_/_0.3)] h-11 font-medium transition-all"
                    >
                        {isPending ? "登录中..." : "立即登录"}
                    </Button>
                    <Button 
                        asChild
                        variant="outline"
                        className="w-full rounded-xl h-11 font-medium border-white/10 text-foreground/70 hover:bg-white/5 hover:text-foreground bg-transparent"
                    >
                        <Link href="/sign-up">注册账号</Link>
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
