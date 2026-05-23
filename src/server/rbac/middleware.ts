import { createMiddleware } from 'hono/factory';
import { isNil } from 'lodash';
import { createErrorResult } from '../common/error';
import { getRbacPrincipalByUserId } from './service';
import { buildAbilityForUser, AppAbility, RbacAction, RbacSubject } from './ability';

import { AuthType } from "@/lib/auth";

export type RbacEnv = {
    Variables: AuthType & {
        currentUser: any;
        ability: AppAbility;
    };
};

export const RbacContextMiddleware = createMiddleware<RbacEnv>(async (c, next) => {
    const user = c.get('user') as any;
    const userId = user?.id;

    if (isNil(userId)) {
        return c.json(createErrorResult('用户未认证'), 401);
    }

    const principal = await getRbacPrincipalByUserId(userId);
    if (isNil(principal)) {
        return c.json(createErrorResult('用户RBAC上下文不存在'), 403);
    }

    c.set('currentUser', principal);
    c.set('ability', buildAbilityForUser(principal));
    await next();
});

export const createPermissionGuard = (options: {
    action: RbacAction;
    subject: RbacSubject;
    getSubject?: (c: any) => Promise<any>;
}) => {
    return createMiddleware(async (c, next) => {
        const ability = c.get('ability') as AppAbility;
        if (isNil(ability)) {
            return c.json(createErrorResult('服务器内部错误：找不到权限上下文'), 500);
        }

        // 全局判断
        if (ability.can(options.action, options.subject)) {
            await next();
            return;
        }

        // 资源级动态判断
        if (options.getSubject) {
            const subjectInstance = await options.getSubject(c);
            if (isNil(subjectInstance)) {
                return c.json(createErrorResult('未找到操作的资源'), 404);
            }
            
            const subjectObj = {
                ...subjectInstance,
                __caslSubjectType__: options.subject,
            };
            
            if (ability.can(options.action, subjectObj as any)) {
                await next();
                return;
            }
        }

        return c.json(createErrorResult('没有权限执行此操作'), 403);
    });
};
