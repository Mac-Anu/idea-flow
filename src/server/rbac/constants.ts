export const systemPermissions = [
    { name: 'article:create', action: 'create', subject: 'Article', label: '创建文章' },
    { name: 'article:read', action: 'read', subject: 'Article', label: '查看文章' },
    { name: 'article:update:any', action: 'update', subject: 'Article', label: '编辑任意文章' },
    { name: 'article:delete:any', action: 'delete', subject: 'Article', label: '删除任意文章' },
    {
        name: 'article:update:own',
        action: 'update',
        subject: 'Article',
        label: '编辑本人文章',
        conditions: { userId: '$currentUserId' },
    },
    {
        name: 'article:delete:own',
        action: 'delete',
        subject: 'Article',
        label: '删除本人文章',
        conditions: { userId: '$currentUserId' },
    },
    { name: 'category:manage', action: 'manage', subject: 'Category', label: '管理分类' },
    { name: 'tag:manage', action: 'manage', subject: 'Tag', label: '管理标签' },
    { name: 'role:manage', action: 'manage', subject: 'Role', label: '管理角色' },
    { name: 'permission:manage', action: 'manage', subject: 'Permission', label: '管理权限' },
];

export const systemRoles = [
    {
        name: 'super_admin',
        label: '超级管理员',
        description: '拥有所有资源的完整管理权限',
        permissions: [],
    },
    {
        name: 'content_manager',
        label: '内容管理员',
        description: '管理文章、分类、标签',
        permissions: [
            'article:create',
            'article:read',
            'article:update:any',
            'article:delete:any',
            'category:manage',
            'tag:manage',
        ],
    },
    {
        name: 'author',
        label: '作者',
        description: '可创建文章并维护自己发布的内容',
        permissions: [
            'article:create',
            'article:read',
            'article:update:own',
            'article:delete:own',
        ],
    },
];
