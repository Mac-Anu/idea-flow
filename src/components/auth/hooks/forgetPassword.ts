'use client';

import type { DeepNonNullable } from 'utility-types';
import type z from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { isNil } from 'lodash';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { authApi } from '@/api/auth';
import { authConfig } from '@/config/auth';
import { getDefaultFormValues } from '@/lib/form';
import { forgetPasswordRequestSchema } from '@/server/user/schema';

const isUserExists = async (data: any) => {
    const val = data.credential as string;
    if (isNil(val) || !val.length) return true;
    const result = await authApi.checkUserExists(val);
    if (!result.ok) return false;
    const { result: isExists } = (await result.json()) as any;
    return isExists;
};

/**
 * 忘记密码表单 schema
 */
const forgetPasswordFormSchema = forgetPasswordRequestSchema
    .extend({
        plainPassword: authConfig.validates.password,
    })
    .superRefine(async (data, ctx) => {
        if (data.credential && !ctx.issues.some((issue) => issue.path?.includes('credential'))) {
            const exists = await isUserExists(data);
            if (!exists) {
                ctx.addIssue({
                    code: 'custom',
                    message: '用户不存在',
                    path: ['credential'],
                });
            }
        }
    });

export type ForgetPasswordFormType = z.infer<typeof forgetPasswordFormSchema>;

/**
 * 创建忘记密码表单构建器
 */
export const useForgetPasswordForm = () => {
    const defaultValues = useMemo(
        () =>
            getDefaultFormValues<ForgetPasswordFormType, ForgetPasswordFormType>([
                'credential',
                'otp',
                'password',
                'plainPassword',
            ]),
        [],
    );
    return useForm<ForgetPasswordFormType>({
        mode: 'all',
        resolver: zodResolver(forgetPasswordFormSchema),
        defaultValues,
    });
};

/**
 * 创建找回密码提交处理器
 */
export const useForgetPasswordSubmit = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    return useCallback(
        async (params: DeepNonNullable<ForgetPasswordFormType>) => {
            const { plainPassword: _, ...rest } = params;
            try {
                const result = await authApi.resetPassword(rest);

                if (!result.ok) {
                    toast.error('密码重置失败', {
                        description: (await result.json()).message,
                    });
                    return;
                }

                let signinPath = '/auth/signin';

                const urlParams = new URLSearchParams();
                searchParams.forEach((value, key) => {
                    urlParams.set(key, value);
                });

                if (urlParams.toString()) {
                    signinPath += `?${urlParams.toString()}`;
                }
                
                toast.success('密码重置成功', {
                    description: '请使用新密码重新登录'
                });
                
                router.push(signinPath);
            } catch (error) {
                toast.error('密码重置失败', {
                    description: (error as Error).message || '服务器错误',
                });
            }
        },
        [router, searchParams],
    );
};
