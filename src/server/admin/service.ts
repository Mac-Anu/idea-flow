import { db } from "@/db";
import { user, invitationCode } from "@/db/auth-schema";
import { role, userRoles } from "@/db/rbac-schema";
import { eq, desc } from "drizzle-orm";

export const getAdminUsers = async () => {
    // Fetch users and their roles
    const users = await db.select({
        id: user.id,
        email: user.email,
        name: user.name,
        banned: user.banned,
        createdAt: user.createdAt,
        roleId: userRoles.roleId,
        roleName: role.name,
    }).from(user)
    .leftJoin(userRoles, eq(user.id, userRoles.userId))
    .leftJoin(role, eq(userRoles.roleId, role.id))
    .orderBy(desc(user.createdAt));
    return users;
};

export const getRoles = async () => {
    return await db.select().from(role);
}

export const updateUserRole = async (userId: string, roleId: string) => {
    await db.transaction(async (tx) => {
        await tx.delete(userRoles).where(eq(userRoles.userId, userId));
        if (roleId) {
            await tx.insert(userRoles).values({ userId, roleId });
        }
    });
    return true;
};

export const toggleUserBan = async (userId: string, banned: boolean) => {
    await db.update(user).set({ banned }).where(eq(user.id, userId));
    return true;
};

export const getInvitations = async () => {
    return await db.select({
        id: invitationCode.id,
        code: invitationCode.code,
        used: invitationCode.used,
        createdAt: invitationCode.createdAt,
        usedBy: invitationCode.usedBy,
        userEmail: user.email,
    })
    .from(invitationCode)
    .leftJoin(user, eq(invitationCode.usedBy, user.id))
    .orderBy(desc(invitationCode.createdAt));
};

export const generateInvitations = async (count: number) => {
    const codesToInsert = Array.from({ length: count }).map(() => ({
        code: Math.random().toString(36).substring(2, 10).toUpperCase(),
    }));
    await db.insert(invitationCode).values(codesToInsert);
    return true;
};

export const deleteInvitation = async (id: string) => {
    await db.delete(invitationCode).where(eq(invitationCode.id, id));
    return true;
};
