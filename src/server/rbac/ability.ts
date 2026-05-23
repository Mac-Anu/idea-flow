import type { MongoAbility } from '@casl/ability';
import { AbilityBuilder, subject as caslSubject, createMongoAbility } from '@casl/ability';

export const rbacActions = ['create', 'read', 'update', 'delete', 'manage'] as const;
export const rbacSubjects = ['Article', 'Category', 'Tag', 'Role', 'Permission', 'all'] as const;

export type RbacAction = (typeof rbacActions)[number];
export type RbacSubject = (typeof rbacSubjects)[number];

export interface PermissionRule {
    action: RbacAction;
    subject: Exclude<RbacSubject, 'all'>;
    conditions?: Record<string, unknown> | null;
    inverted?: boolean;
    reason?: string | null;
}

export interface RoleSummary {
    name: string;
}

export interface RbacPrincipal {
    id: string;
    roles: RoleSummary[];
    permissions: PermissionRule[];
}

export type AppAbility = MongoAbility<[RbacAction, RbacSubject | object]>;

export const subject = <T extends Exclude<RbacSubject, 'all'>>(
    name: T,
    payload: Record<string, unknown> = {},
) => caslSubject(name, payload);

export const buildAbilityForUser = (principal: RbacPrincipal): AppAbility => {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
        createMongoAbility as unknown as new (
            rules?: any[],
            options?: Record<string, unknown>,
        ) => AppAbility,
    );
    const isSuperAdmin = principal.roles.some((role) => role.name === 'super_admin');

    if (isSuperAdmin) {
        can('manage', 'all');
        return build();
    }

    for (const permission of principal.permissions) {
        const apply = permission.inverted ? cannot : can;
        if (permission.conditions && Object.keys(permission.conditions).length > 0) {
            apply(permission.action, permission.subject, permission.conditions);
        } else {
            apply(permission.action, permission.subject);
        }
    }

    return build({
        detectSubjectType: (value) =>
            typeof value === 'string'
                ? value
                : ((value as { __caslSubjectType__?: RbacSubject }).__caslSubjectType__ ?? 'all'),
    });
};
