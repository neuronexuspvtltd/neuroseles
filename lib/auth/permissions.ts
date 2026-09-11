export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_STAFF';

export type Permission =
  | 'dashboard.view'
  | 'leads.view'
  | 'leads.create'
  | 'leads.edit'
  | 'leads.delete'
  | 'leads.assign'
  | 'calls.create'
  | 'followups.view'
  | 'followups.create'
  | 'followups.edit'
  | 'demos.view'
  | 'demos.create'
  | 'demos.edit'
  | 'quotations.view'
  | 'quotations.create'
  | 'quotations.edit'
  | 'quotations.delete'
  | 'clients.view'
  | 'clients.create'
  | 'clients.edit'
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'files.view'
  | 'files.upload'
  | 'reports.view'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'settings.view'
  | 'settings.edit'
  | 'activities.view';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'dashboard.view',
    'leads.view',
    'leads.create',
    'leads.edit',
    'leads.delete',
    'leads.assign',
    'calls.create',
    'followups.view',
    'followups.create',
    'followups.edit',
    'demos.view',
    'demos.create',
    'demos.edit',
    'quotations.view',
    'quotations.create',
    'quotations.edit',
    'quotations.delete',
    'clients.view',
    'clients.create',
    'clients.edit',
    'projects.view',
    'projects.create',
    'projects.edit',
    'files.view',
    'files.upload',
    'reports.view',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'settings.view',
    'settings.edit',
    'activities.view',
  ],

  MANAGER: [
    'dashboard.view',
    'leads.view',
    'leads.create',
    'leads.edit',
    'leads.delete',
    'leads.assign',
    'calls.create',
    'followups.view',
    'followups.create',
    'followups.edit',
    'demos.view',
    'demos.create',
    'demos.edit',
    'quotations.view',
    'quotations.create',
    'quotations.edit',
    'quotations.delete',
    'clients.view',
    'clients.create',
    'clients.edit',
    'projects.view',
    'projects.create',
    'projects.edit',
    'files.view',
    'files.upload',
    'reports.view',
    'activities.view',
    'settings.view',
  ],

  SALES_STAFF: [
    'dashboard.view',
    'leads.view',
    'leads.create',
    'leads.edit',
    'calls.create',
    'followups.view',
    'followups.create',
    'followups.edit',
    'demos.view',
    'demos.create',
    'demos.edit',
    'quotations.view',
    'quotations.create',
    'quotations.edit',
    'clients.view',
    'projects.view',
    'files.view',
    'files.upload',
    'activities.view',
    'settings.view',
  ],
};

export function hasPermission(
  user: { role: string; status?: string } | null | undefined,
  permission: Permission
): boolean {
  if (!user || user.status === 'INACTIVE') {
    return false;
  }
  const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole];
  if (!rolePermissions) {
    return false;
  }
  return rolePermissions.includes(permission);
}
