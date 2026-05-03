'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { isNil } from 'lodash';
import { z } from 'zod';
import { authApi } from '@/api/auth';
import { authConfig } from '@/config/auth';
import type { EmailOTPType } from '@/server/user/constants';

interface checkCountDownPayload {
    credential: string;
    type: `${EmailOTPType}`;
    refs: { initialized: boolean; initializing: boolean };
    setCountdown: (time: number) => void;
}

const checkCountdown = async ({ credential, type, refs, setCountdown }: checkCountDownPayload) => {
    if (isNil(credential) || refs.initialized || refs.initializing) return;
    if (
        type === 'forget-password' &&
        !authConfig.validates.username.safeParse(credential).success &&
        !z.email().safeParse(credential).success
    )
        return;
    if (type === 'email-verification' && !z.email().safeParse(credential).success) return;
    refs.initializing = true;
    try {
        const result = await authApi.getOTPStatus({ credential, type });
        if (result.ok) {
            const data = await result.json();
            if (!data.canSend && data.remainingTime) {
                setCountdown(data.remainingTime);
            } else {
                setCountdown(0);
            }
        }
    } catch (error) {
        console.error('获取 OTP 状态失败:', error);
    } finally {
        refs.initialized = true;
        refs.initializing = false;
    }
};

/**
 * 通用的 OTP 发送 Hook
 */
const useOTPSender = (
    sendApi: (credential: string) => Promise<Response>,
    credential: string,
    type: `${EmailOTPType}`,
) => {
    const [countdown, setCountdown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const initializedRef = useRef(false);
    const initializingRef = useRef(false);

    useEffect(() => {
        checkCountdown({
            credential,
            type,
            refs: { initialized: initializedRef.current, initializing: initializingRef.current },
            setCountdown,
        });
    }, [initializedRef.current, initializingRef.current, credential, type]);

    // 倒计时逻辑
    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setTimeout(() => {
            setCountdown(countdown - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    // 当凭证变化时重置初始化状态
    useEffect(() => {
        if (credential) {
            initializedRef.current = false;
        }
    }, [credential]);

    const sendOTP = useCallback(
        async (credential: string) => {
            if (countdown > 0 || isLoading) return;

            setIsLoading(true);
            try {
                const result = await sendApi(credential);
                const data = await result.json();

                if (result.ok) {
                    toast.success('验证码发送成功', {
                        description: '请查收您的邮箱',
                    });
                    // 使用后端返回的倒计时
                    if (data.remainingTime) {
                        setCountdown(data.remainingTime);
                    }
                } else if (result.status === 429) {
                    // 频率限制
                    toast.warning('发送频率限制', {
                        description: data.message,
                    });
                    // 设置剩余时间
                    if (data.remainingTime) {
                        setCountdown(data.remainingTime);
                    }
                } else {
                    toast.error('发送失败', {
                        description: data.message || '请稍后重试',
                    });
                }
            } catch (error) {
                toast.error('发送失败', {
                    description: (error as Error).message || '网络错误，请稍后重试',
                });
            } finally {
                setIsLoading(false);
            }
        },
        [countdown, isLoading, sendApi],
    );

    const buttonText = useMemo(() => {
        if (isLoading) return '发送中...';
        if (countdown > 0) return `${countdown}秒后重发`;
        return '发送验证码';
    }, [isLoading, countdown]);

    const canSend = countdown === 0 && !isLoading;

    return {
        sendOTP,
        buttonText,
        canSend,
        countdown,
        isLoading,
    };
};

/**
 * 发送注册验证码
 */
export const useSendVerificationOTP = (email: string) =>
    useOTPSender(
        (email: string) => authApi.sendEmailVerificationOTP(email),
        email,
        'email-verification',
    );

/**
 * 发送忘记密码验证码
 */
export const useSendForgetPasswordOTP = (credential: string) =>
    useOTPSender(
        (credential: string) => authApi.sendForgetPasswordOTP(credential),
        credential,
        'forget-password',
    );
