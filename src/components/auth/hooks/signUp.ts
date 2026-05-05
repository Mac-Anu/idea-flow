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
import { signUpRequestSchema } from '@/server/user/schema';

const isUsernameOrEmailUnique = (type: 'username' | 'email') => async (data: any) => {
    const val = data[type] as string;
    if (isNil(val) || !val.length) return true;
    const result =
        type === 'username'
            ? await authApi.checkUsernameUnique(val)
            : await authApi.checkEmailUnique(val);
    
    if (!result.ok) return false;
    const { result: isUnique } = (await result.json()) as any;
    return isUnique;
};

// 改造原有的 Schema，加上确认密码
const signUpFormSchema = signUpRequestSchema
    .extend({
        plainPassword: authConfig.validates.password,
    })
    .refine((data) => data.password === data.plainPassword, {
        message: '两次输入的密码不一致',
        path: ['plainPassword'],
    })
    .superRefine(async (data, ctx) => {
        // 只有在 username 字段存在且格式正确时才检查唯一性
        if (data.username && !ctx.issues.some((issue) => issue.path?.includes('username'))) {
            const isUnique = await isUsernameOrEmailUnique('username')(data);
            if (!isUnique) {
                ctx.addIssue({
                    code: 'custom',
                    message: '用户名必须是唯一的,请重新填写',
                    path: ['username'],
                });
            }
        }

        // 只有在 email 字段存在且格式正确时才检查唯一性
        if (data.email && !ctx.issues.some((issue) => issue.path?.includes('email'))) {
            const isUnique = await isUsernameOrEmailUnique('email')(data);
            if (!isUnique) {
                ctx.addIssue({
                    code: 'custom',
                    message: '邮箱地址必须是唯一的,请重新填写',
                    path: ['email'],
                });
            }
        }
    });

type SignUpFormType = z.infer<typeof signUpFormSchema>;

export const useSignUpForm = () => {
    const defaultValues = useMemo(() => {
        const values = getDefaultFormValues([
            'username',
            'email',
            'otp',
            'password',
            'plainPassword',
        ]);
        return { ...values, validateType: 'email' } as SignUpFormType;
    }, []);
    return useForm<SignUpFormType>({
        mode: 'onBlur',
        resolver: zodResolver(signUpFormSchema),
        defaultValues,
    });
};

export const useSignUpSubmit = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    return useCallback(
        async (params: DeepNonNullable<SignUpFormType>) => {
            try {
                const { plainPassword: _, ...rest } = params;
                const result = await authApi.signUp(rest);
                if (!result.ok) {
                    toast.error('注册失败', {
                        description: (await result.json()).message,
                    });
                    return;
                }

                let signinPath = '/sign-in';

                const urlParams = new URLSearchParams();
                searchParams.forEach((value, key) => {
                    urlParams.set(key, value);
                });

                if (urlParams.toString()) {
                    signinPath += `?${urlParams.toString()}`;
                }
                
                toast.success('注册成功，请重新登录');
                router.push(signinPath);
            } catch (error) {
                toast.error('注册失败', {
                    description: (error as Error).message || '服务器错误',
                });
            }
        },
        [router, searchParams],
    );
};
