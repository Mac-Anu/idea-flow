"use client";

import { useTransition, Suspense, useMemo, useCallback, FC } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForgetPasswordForm, useForgetPasswordSubmit, useSendForgetPasswordOTP } from "../hooks";

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
    const form = useForgetPasswordForm();
    const submitHandler = useForgetPasswordSubmit();
    const [isPending, startTransition] = useTransition();
    const credential = form.watch('credential');
    const { sendOTP, buttonText, canSend } = useSendForgetPasswordOTP(credential);

    const disableSendBtn = useMemo(
        () => !credential || !!form.formState.errors.credential || form.formState.isSubmitting || isPending || !canSend,
        [credential, form.formState.errors.credential, form.formState.isSubmitting, isPending, canSend],
    );
  
    const sendOTPHandler = useCallback(async () => {
        if (!disableSendBtn) await sendOTP(credential);
    }, [disableSendBtn, credential, sendOTP]);

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
                    name="credential"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/70">
                                账号 / 邮箱
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="请输入您的用户名或邮箱地址"
                                    className="bg-background border-border focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-11 text-foreground placeholder:text-foreground/30"
                                    disabled={form.formState.isSubmitting || isPending}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-destructive" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/70">
                                验证码
                            </FormLabel>
                            <FormControl>
                                <div className="flex space-x-3">
                                    <Input
                                        placeholder="6位数字验证码"
                                        maxLength={6}
                                        className="bg-background border-border focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-11 text-foreground placeholder:text-foreground/30 flex-1"
                                        disabled={form.formState.isSubmitting || isPending}
                                        {...field}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={disableSendBtn}
                                        onClick={sendOTPHandler}
                                        className="rounded-xl h-11 px-4 font-medium border-white/10 text-foreground/70 hover:bg-white/5 hover:text-foreground whitespace-nowrap bg-transparent"
                                    >
                                        {buttonText}
                                    </Button>
                                </div>
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
                            <FormLabel className="text-sm font-medium text-foreground/70">
                                新密码
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="请输入新密码（至少 6 位）"
                                    className="bg-background border-border focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-11 text-foreground placeholder:text-foreground/30"
                                    disabled={form.formState.isSubmitting || isPending}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-destructive" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="plainPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground/70">
                                确认新密码
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="请再次输入新密码"
                                    className="bg-background border-border focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-11 text-foreground placeholder:text-foreground/30"
                                    disabled={form.formState.isSubmitting || isPending}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs text-destructive" />
                        </FormItem>
                    )}
                />

                <div className="space-y-3 pt-2">
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting || isPending}
                        className="w-full bg-primary hover:brightness-110 text-primary-foreground rounded-xl shadow-[0_4px_20px_oklch(0.7_0.19_40_/_0.3)] h-11 font-medium transition-all"
                    >
                        {(form.formState.isSubmitting || isPending) ? "提交中..." : "重置密码"}
                    </Button>
                    <Button 
                        asChild 
                        variant="outline"
                        className="w-full rounded-xl h-11 font-medium border-white/10 text-foreground/70 hover:bg-white/5 hover:text-foreground bg-transparent"
                    >
                        <Link href={signinUrl}>返回登录</Link>
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export const ForgetPasswordForm: FC = () => (
    <Suspense fallback={<AuthFormSkeleton />}>
        <FormComponent />
    </Suspense>
);
