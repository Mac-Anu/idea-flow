'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { DeepNonNullable } from 'utility-types';

import { signUpRequestSchema } from '@/server/user/schema';
import type { SignUpRequest, User } from '@/server/user/type';
import { authApi } from '@/api/auth';
import { useSetAuth } from './auth';

/**
 * 创建注册表单构建器
 */
export const useSignUpForm = () => {
    const defaultValues = {
        username: '',
        email: '',
        password: '',
    } as DeepNonNullable<SignUpRequest>;

    return useForm<SignUpRequest>({
        mode: 'all',
        resolver: zodResolver(signUpRequestSchema),
        defaultValues,
    });
};

/**
 * 创建注册提交处理器
 */
export const useSignUpSubmit = () => {
    const router = useRouter();
    const setAuth = useSetAuth();

    return useCallback(
        async (params: DeepNonNullable<SignUpRequest>) => {
            try {
                await authApi.signUp(params, {
                    onSuccess: (c) => {
                        setAuth(c.data?.user as unknown as User);
                        toast.success('注册成功！');
                        router.replace('/');
                    },
                    onError: (error: any) => {
                        toast.error('注册失败', {
                            description: error.error?.message || '请检查输入信息',
                        });
                    },
                });
            } catch (error) {
                toast.error('网络异常', {
                    description: (error as Error).message || '服务器出错了',
                });
            }
        },
        [router, setAuth],
    );
};
