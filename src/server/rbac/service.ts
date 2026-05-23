import { isNil } from 'lodash';
import { db } from '@/db';
import type { PermissionRule, RbacPrincipal } from './ability';

export const normalizePermissionRule = (
    permission: any,
    userId: string,
): PermissionRule & { name: string } => {
    let conditions = permission.conditions as Record<string, unknown> | null;
    if (conditions) {
        conditions = JSON.parse(JSON.stringify(conditions).replace(/\$currentUserId/g, userId));
    }

    return {
        name: permission.name,
        action: permission.action as any,
        subject: permission.subject as any,
        conditions,
        inverted: permission.inverted,
        reason: permission.reason,
    };
};

export const getRbacPrincipalByUserId = async (userId: string): Promise<RbacPrincipal | null> => {
    const existingUser = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
        with: {
            roles: {
                with: {
                    role: {
                        with: {
                            permissions: {
                                with: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            },
            permissions: {
                with: {
                    permission: true,
                },
            },
        },
    });

    if (isNil(existingUser)) return null;

    const permissionMap = new Map<string, PermissionRule & { name: string }>();

    // 1. 合并用户的直授权限
    existingUser.permissions.forEach((up) => {
        if (up.permission) {
            permissionMap.set(up.permission.name, normalizePermissionRule(up.permission, existingUser.id));
        }
    });

    // 2. 合并角色的继承权限
    existingUser.roles.forEach((ur) => {
        if (ur.role) {
            ur.role.permissions.forEach((rp) => {
                if (rp.permission && !permissionMap.has(rp.permission.name)) {
                    permissionMap.set(rp.permission.name, normalizePermissionRule(rp.permission, existingUser.id));
                }
            });
        }
    });

    return {
        id: existingUser.id,
        roles: existingUser.roles.map((ur) => ({ name: ur.role.name })),
        permissions: Array.from(permissionMap.values()),
    };
};
