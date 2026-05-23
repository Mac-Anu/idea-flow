import { db } from "../src/db";
import { role, permission, rolePermissions, userRoles, user } from "../src/db/schema";
import { systemPermissions, systemRoles } from "../src/server/rbac/constants";
import { eq } from "drizzle-orm";

async function main() {
    console.log("=== 开始注入 RBAC 种子数据 ===");

    // 1. 注入 Permissions
    const permMap = new Map();
    for (const p of systemPermissions) {
        const [existing] = await db.select().from(permission).where(eq(permission.name, p.name));
        let pId;
        if (!existing) {
            console.log(`创建权限: ${p.name}`);
            const [created] = await db.insert(permission).values({
                name: p.name,
                action: p.action,
                subject: p.subject,
                label: p.label,
                conditions: p.conditions || null,
                systemed: true,
            }).returning();
            pId = created.id;
        } else {
            console.log(`更新权限: ${p.name}`);
            await db.update(permission).set({
                action: p.action,
                subject: p.subject,
                label: p.label,
                conditions: p.conditions || null,
            }).where(eq(permission.id, existing.id));
            pId = existing.id;
        }
        permMap.set(p.name, pId);
    }

    // 2. 注入 Roles 并关联 Permissions
    let superAdminRoleId = null;
    for (const r of systemRoles) {
        const [existing] = await db.select().from(role).where(eq(role.name, r.name));
        let rId;
        if (!existing) {
            console.log(`创建角色: ${r.name}`);
            const [created] = await db.insert(role).values({
                name: r.name,
                label: r.label,
                description: r.description,
                systemed: true,
            }).returning();
            rId = created.id;
        } else {
            console.log(`更新角色: ${r.name}`);
            await db.update(role).set({
                label: r.label,
                description: r.description,
            }).where(eq(role.id, existing.id));
            rId = existing.id;
        }
        
        if (r.name === 'super_admin') superAdminRoleId = rId;

        // 重新绑定权限关联 (粗暴做法：全删再重建)
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, rId));
        
        for (const pName of r.permissions) {
            const pId = permMap.get(pName);
            if (pId) {
                await db.insert(rolePermissions).values({
                    roleId: rId,
                    permissionId: pId,
                });
            }
        }
    }

    // 3. 寻找当前系统里的任何用户，并赋予 super_admin 角色（提权）
    const allUsers = await db.select().from(user);
    if (allUsers.length > 0 && superAdminRoleId) {
        console.log("找到以下用户，正在提权为 super_admin:");
        for (const u of allUsers) {
            console.log(`- ${u.email || u.username}`);
            // 检查是否已有角色
            const [existingUserRole] = await db.select().from(userRoles)
                .where(eq(userRoles.userId, u.id)); // 这里为了简单，如果有别的角色不管，直接给 super_admin
            
            if (!existingUserRole) {
                await db.insert(userRoles).values({
                    userId: u.id,
                    roleId: superAdminRoleId,
                });
            } else {
                // 如果已经有别的角色，也可以强制更新或保留。这里简单点，如果还没超管就加上
                const userRoleList = await db.select().from(userRoles).where(eq(userRoles.userId, u.id));
                if (!userRoleList.some(ur => ur.roleId === superAdminRoleId)) {
                    await db.insert(userRoles).values({
                        userId: u.id,
                        roleId: superAdminRoleId,
                    });
                }
            }
        }
    } else {
        console.log("未找到用户，跳过提权。");
    }

    console.log("=== RBAC 种子数据注入完成 ===");
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
