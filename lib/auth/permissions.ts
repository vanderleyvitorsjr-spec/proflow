export const ROLES = [
  "OWNER", "ADMIN", "MANAGER", "CUSTOMER_SERVICE", "FINANCE",
  "TECHNICIAN", "INVENTORY", "VIEWER",
] as const;
export type AppRole = (typeof ROLES)[number];

export const PERMISSIONS = [
  "CLIENTS_VIEW","CLIENTS_CREATE","CLIENTS_UPDATE","CLIENTS_DELETE",
  "CRM_VIEW","CRM_MANAGE","ORDERS_VIEW","ORDERS_CREATE","ORDERS_UPDATE",
  "ORDERS_COMPLETE","ORDERS_DELETE","AGENDA_VIEW","AGENDA_MANAGE",
  "FINANCE_VIEW","FINANCE_CREATE","FINANCE_UPDATE","FINANCE_CONFIRM_PAYMENT",
  "FINANCE_DELETE","INVENTORY_VIEW","INVENTORY_MANAGE","INVENTORY_MOVE",
  "EQUIPMENT_VIEW","EQUIPMENT_MANAGE","AUTOMATIONS_VIEW","AUTOMATIONS_MANAGE",
  "AUTOMATIONS_SIMULATE","REPORTS_VIEW","REPORTS_EXPORT","TEAM_VIEW",
  "TEAM_MANAGE","SETTINGS_VIEW","SETTINGS_MANAGE","AUDIT_VIEW",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type PermissionOverrides = {
  allow?: readonly Permission[];
  deny?: readonly Permission[];
};

const all = new Set<Permission>(PERMISSIONS);
const view = PERMISSIONS.filter((item) => item.endsWith("_VIEW"));
export const ROLE_LABELS: Record<AppRole, string> = {
  OWNER:"Proprietário", ADMIN:"Administrador", MANAGER:"Gestor",
  CUSTOMER_SERVICE:"Atendimento", FINANCE:"Financeiro", TECHNICIAN:"Técnico",
  INVENTORY:"Estoque", VIEWER:"Visualização",
};
export const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<Permission>> = {
  OWNER: all,
  ADMIN: new Set(PERMISSIONS.filter((p) => p !== "FINANCE_CONFIRM_PAYMENT")),
  MANAGER: new Set(PERMISSIONS.filter((p) => !["SETTINGS_MANAGE","TEAM_MANAGE","AUDIT_VIEW","FINANCE_DELETE"].includes(p))),
  CUSTOMER_SERVICE: new Set(["CLIENTS_VIEW","CLIENTS_CREATE","CLIENTS_UPDATE","CRM_VIEW","CRM_MANAGE","ORDERS_VIEW","ORDERS_CREATE","AGENDA_VIEW","AGENDA_MANAGE"]),
  FINANCE: new Set(["CLIENTS_VIEW","ORDERS_VIEW","FINANCE_VIEW","FINANCE_CREATE","FINANCE_UPDATE","FINANCE_CONFIRM_PAYMENT","REPORTS_VIEW","REPORTS_EXPORT"]),
  TECHNICIAN: new Set(["CLIENTS_VIEW","ORDERS_VIEW","ORDERS_UPDATE","ORDERS_COMPLETE","AGENDA_VIEW","EQUIPMENT_VIEW"]),
  INVENTORY: new Set(["ORDERS_VIEW","INVENTORY_VIEW","INVENTORY_MANAGE","INVENTORY_MOVE","EQUIPMENT_VIEW"]),
  VIEWER: new Set(view),
};

export function hasPermission(
  role: AppRole,
  permission: Permission,
  overrides: PermissionOverrides | readonly Permission[] = {},
) {
  const normalized: PermissionOverrides = Array.isArray(overrides)
    ? { allow: overrides as readonly Permission[] }
    : (overrides as PermissionOverrides);
  if (normalized.deny?.includes(permission)) return false;
  if (normalized.allow?.includes(permission)) return true;
  return ROLE_PERMISSIONS[role].has(permission);
}
