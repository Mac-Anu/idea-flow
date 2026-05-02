'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isNil } from 'lodash';
import type { DeepNonNullable } from 'utility-types';

import { signInRequestSchema } from '@/server/user/schema';
import type { SignInRequest, User } from '@/server/user/type';
import { authApi } from '@/api/auth';
import { useSetAuth } from './auth';

/**
 * 创建登录表单构建器
 */
export const useSignInForm = () => {
    const defaultValues = {
        username: '',
        password: '',
    } as DeepNonNullable<SignInRequest>;

    return useForm<SignInRequest>({
        mode: 'all',
        resolver: zodResolver(signInRequestSchema),
        defaultValues,
    });
};

/**
 * 创建登录提交处理器
 */
export const useSignInSubmit = () => {
    const router = useRouter();
    const setAuth = useSetAuth();

    return useCallback(
        async (params: DeepNonNullable<SignInRequest>) => {
            try {
                await authApi.signIn(params, {
                    onSuccess: (c) => {
                        setAuth(c.data?.user as unknown as User);
                        toast.success('登录成功，欢迎掌控空间！');
                        const urlParams = new URLSearchParams(window.location.search);
                        const callbackUrl = urlParams.get('callbackUrl');
                        isNil(callbackUrl) ? router.replace('/') : router.replace(callbackUrl);
                    },
                    onError: (error: any) => {
                        toast.error('登录被驳回', {
                            description: error.error?.message || '请检查账号或密码',
                        });
                    },
                });
            } catch (error) {
                toast.error('登录网络异常', {
                    description: (error as Error).message || '服务器出错了',
                });
            }
        },
        [router, setAuth],
    );
};
