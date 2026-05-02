'use client';

import { use, useCallback, useMemo } from 'react';
import { AuthContext } from '../constants';
import type { User } from '@/server/user/type';

/**
 * 获取当前登录用户
 */
export const useAuth = () => {
    const { auth } = use(AuthContext);
    return useMemo(() => auth, [auth]);
};

/**
 * 设置全局登录用户状态
 */
export const useSetAuth = () => {
    const { setAuth } = use(AuthContext);
    return useCallback((auth: User | null) => setAuth(auth), [setAuth]);
};
