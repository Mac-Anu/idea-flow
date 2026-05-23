import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// 角色表
export const role = pgTable("rbac_roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // 角色的唯一标识，例如 super_admin
  label: text("label").notNull(), // 后台展示的角色名称
  description: text("description"), // 角色说明
  systemed: boolean("systemed").default(false).notNull(), // 是否为内置角色
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// 权限表
export const permission = pgTable("rbac_permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // 权限的唯一标识，便于同步
  action: text("action").notNull(), // 动作 (create, read, update, delete, manage)
  subject: text("subject").notNull(), // 资源类型 (Article, Category, Tag, Role, Permission)
  label: text("label").notNull(), // 后台展示的权限名称
  description: text("description"), // 权限说明
  conditions: jsonb("conditions"), // 动态条件 {"userId": "$currentUserId"}
  inverted: boolean("inverted").default(false).notNull(), // 是否为反向规则 (deny)
  systemed: boolean("systemed").default(false).notNull(), // 是否为内置权限
  reason: text("reason"), // 权限提示信息
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// 用户-角色 关联表 (Many-to-Many)
export const userRoles = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

// 角色-权限 关联表 (Many-to-Many)
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

// 用户-特殊权限 关联表 (Many-to-Many，直授权限)
export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.permissionId] })]
);

// 关联配置 (Relations)
export const roleRelations = relations(role, ({ many }) => ({
  users: many(userRoles),
  permissions: many(rolePermissions),
}));

export const permissionRelations = relations(permission, ({ many }) => ({
  roles: many(rolePermissions),
  users: many(userPermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(user, { fields: [userRoles.userId], references: [user.id] }),
  role: one(role, { fields: [userRoles.roleId], references: [role.id] }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(role, { fields: [rolePermissions.roleId], references: [role.id] }),
  permission: one(permission, { fields: [rolePermissions.permissionId], references: [permission.id] }),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(user, { fields: [userPermissions.userId], references: [user.id] }),
  permission: one(permission, { fields: [userPermissions.permissionId], references: [permission.id] }),
}));
