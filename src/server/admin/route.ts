import { createHonoApp } from "../common/app";
import { AuthProtectedMiddleware } from "../user/middlwares";
import { RbacContextMiddleware, createPermissionGuard } from "../rbac/middleware";
import {
    getAdminUsers,
    getRoles,
    updateUserRole,
    toggleUserBan,
    getInvitations,
    generateInvitations,
    deleteInvitation
} from "./service";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const app = createHonoApp();

app.use("*", AuthProtectedMiddleware);
app.use("*", RbacContextMiddleware);
app.use("*", createPermissionGuard({ action: 'manage', subject: 'all' as any }));

export const adminApi = app
    .get("/users", async (c) => {
        const users = await getAdminUsers();
        return c.json({ data: users });
    })
    .get("/roles", async (c) => {
        const roles = await getRoles();
        return c.json({ data: roles });
    })
    .patch("/users/:id/role", zValidator("json", z.object({ roleId: z.string() })), async (c) => {
        const id = c.req.param("id");
        const { roleId } = c.req.valid("json");
        await updateUserRole(id, roleId);
        return c.json({ success: true });
    })
    .patch("/users/:id/ban", zValidator("json", z.object({ banned: z.boolean() })), async (c) => {
        const id = c.req.param("id");
        const { banned } = c.req.valid("json");
        await toggleUserBan(id, banned);
        return c.json({ success: true });
    })
    .get("/invitations", async (c) => {
        const invs = await getInvitations();
        return c.json({ data: invs });
    })
    .post("/invitations", zValidator("json", z.object({ count: z.number().min(1).max(50) })), async (c) => {
        const { count } = c.req.valid("json");
        await generateInvitations(count);
        return c.json({ success: true });
    })
    .delete("/invitations/:id", async (c) => {
        const id = c.req.param("id");
        await deleteInvitation(id);
        return c.json({ success: true });
    });
