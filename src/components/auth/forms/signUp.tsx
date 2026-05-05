"use client";

import { useTransition, Suspense, useMemo, useCallback, FC } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSignUpForm, useSignUpSubmit, useSendVerificationOTP } from "../hooks";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthFormSkeleton } from "../skeleton";

function FormComponent() {
    const form = useSignUpForm();
    const submitHandler = useSignUpSubmit();
    const [isPending, startTransition] = useTransition();
    const username = form.watch('username');
    const email = form.watch('email');
    const { sendOTP, buttonText, canSend } = useSendVerificationOTP(email);
    
    const searchParams = useSearchParams();

    const signinUrl = useMemo(() => {
        let url = '/sign-in';
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
            params.set(key, value);
        });

        if (params.toString()) url += `?${params.toString()}`;

        return url;
    }, [searchParams]);

    const disableSendBtn = useMemo(() => {
        return (
            !username ||
            !email ||
            !!form.formState.errors.username ||
            !!form.formState.errors.email ||
            form.formState.isSubmitting ||
            isPending ||
            !canSend
        );
    }, [
        username,
        email,
        form.formState.errors.username,
        form.formState.errors.email,
        form.formState.isSubmitting,
        isPending,
        canSend
    ]);

    const sendOTPHandler = useCallback(async () => {
        if (!disableSendBtn) await sendOTP(email);
    }, [disableSendBtn, email, sendOTP]);

    const onSubmit = form.handleSubmit((values) => {
        startTransition(() => {
            submitHandler(values as Parameters<typeof submitHandler>[0]);
        });
    });

    return (
        <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-5">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-[#5e5448]">
                                用户名
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="起个好听的名字（至少 3 位）"
                                    className="bg-[#fdfaf5] border-black/5 focus-visible:ring-[#c8a96e] focus-visible:border-[#dec9a0] rounded-xl h-11 text-[#1f1d1a] placeholder:text-[#c7b9a5]"
                                    disabled={form.formState.isSubmitting || isPending}
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
                            <FormLabel className="text-sm font-medium text-[#5e5448]">
                                邮箱
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="bg-[#fdfaf5] border-black/5 focus-visible:ring-[#c8a96e] focus-visible:border-[#dec9a0] rounded-xl h-11 text-[#1f1d1a] placeholder:text-[#c7b9a5]"
                                    disabled={form.formState.isSubmitting || isPending}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-[#5e5448]">
                                验证码
                            </FormLabel>
                            <FormControl>
                                <div className="flex space-x-3">
                                    <Input
                                        placeholder="6位数字验证码"
                                        maxLength={6}
                                        className="bg-[#fdfaf5] border-black/5 focus-visible:ring-[#c8a96e] focus-visible:border-[#dec9a0] rounded-xl h-11 text-[#1f1d1a] placeholder:text-[#c7b9a5] flex-1"
                                        disabled={form.formState.isSubmitting || isPending}
                                        {...field}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={disableSendBtn}
                                        onClick={sendOTPHandler}
                                        className="rounded-xl h-11 px-4 font-medium border-[#c8a96e]/30 text-[#5e5448] hover:bg-[#fdfaf5] hover:text-[#3a342e] whitespace-nowrap"
                                    >
                                        {buttonText}
                                    </Button>
                                </div>
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
                            <FormLabel className="text-sm font-medium text-[#5e5448]">
                                密码
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="请输入密码（至少 6 位）"
                                    className="bg-[#fdfaf5] border-black/5 focus-visible:ring-[#c8a96e] focus-visible:border-[#dec9a0] rounded-xl h-11 text-[#1f1d1a] placeholder:text-[#c7b9a5]"
                                    disabled={form.formState.isSubmitting || isPending}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="plainPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-[#5e5448]">
                                确认密码
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="请再次输入密码"
                                    className="bg-[#fdfaf5] border-black/5 focus-visible:ring-[#c8a96e] focus-visible:border-[#dec9a0] rounded-xl h-11 text-[#1f1d1a] placeholder:text-[#c7b9a5]"
                                    disabled={form.formState.isSubmitting || isPending}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                    )}
                />

                <div className="space-y-3 pt-2">
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting || isPending}
                        className="w-full bg-[#1f1d1a] hover:bg-[#3a342e] text-white rounded-xl shadow-sm h-11 font-medium transition-colors"
                    >
                        {(form.formState.isSubmitting || isPending) ? "注册中..." : "立即注册"}
                    </Button>
                    <Button 
                        asChild 
                        variant="outline"
                        className="w-full rounded-xl h-11 font-medium border-[#c8a96e]/30 text-[#5e5448] hover:bg-[#fdfaf5] hover:text-[#3a342e]"
                    >
                        <Link href={signinUrl}>返回登录</Link>
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export const SignUpForm: FC = () => (
    <Suspense fallback={<AuthFormSkeleton />}>
        <FormComponent />
    </Suspense>
);
