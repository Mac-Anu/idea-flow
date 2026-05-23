import { useMemo } from 'react';
import { authClient } from '@/api/auth';
import { buildAbilityForUser, AppAbility, RbacAction, RbacSubject } from '@/server/rbac/ability';

export function useAbility(): AppAbility | null {
    const { data: session } = authClient.useSession();

    const ability = useMemo(() => {
        if (!session?.user) return null;
        
        // 我们在后端拦截了 /api/auth/get-session，
        // 将 roles 和 permissions 注入到了 user 对象中
        const user = session.user as any;
        
        return buildAbilityForUser({
            id: user.id,
            roles: user.roles || [],
            permissions: user.permissions || [],
        });
    }, [session?.user]);

    return ability;
}
