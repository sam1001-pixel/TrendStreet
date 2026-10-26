/**
 * Trend Street — Role-Based Access Control (RBAC) System
 * Provides least-privilege permissions matrix for atelier staff and administrators.
 */

export type AdminRole =
  | "Owner/Admin"
  | "Catalog Manager"
  | "Fulfilment Manager"
  | "Content Editor"
  | "Read-only Analyst";

export type AdminModule =
  | "overview"
  | "orders"
  | "products"
  | "inventory"
  | "customers"
  | "discounts"
  | "shipping"
  | "analytics"
  | "content"
  | "settings"
  | "staff"
  | "audit";

export type AdminAction = "view" | "create" | "update" | "delete" | "export";

export interface RolePermissions {
  modules: Record<AdminModule, {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canExport: boolean;
  }>;
}

const ALL_ALLOWED = { canView: true, canCreate: true, canUpdate: true, canDelete: true, canExport: true };
const VIEW_ONLY = { canView: true, canCreate: false, canUpdate: false, canDelete: false, canExport: false };
const NO_ACCESS = { canView: false, canCreate: false, canUpdate: false, canDelete: false, canExport: false };

export const ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  "Owner/Admin": {
    modules: {
      overview: ALL_ALLOWED,
      orders: ALL_ALLOWED,
      products: ALL_ALLOWED,
      inventory: ALL_ALLOWED,
      customers: ALL_ALLOWED,
      discounts: ALL_ALLOWED,
      shipping: ALL_ALLOWED,
      analytics: ALL_ALLOWED,
      content: ALL_ALLOWED,
      settings: ALL_ALLOWED,
      staff: ALL_ALLOWED,
      audit: ALL_ALLOWED,
    },
  },
  "Catalog Manager": {
    modules: {
      overview: { ...VIEW_ONLY, canExport: true },
      orders: VIEW_ONLY,
      products: ALL_ALLOWED,
      inventory: { canView: true, canCreate: true, canUpdate: true, canDelete: false, canExport: true },
      customers: NO_ACCESS,
      discounts: ALL_ALLOWED,
      shipping: NO_ACCESS,
      analytics: { ...VIEW_ONLY, canExport: true },
      content: { canView: true, canCreate: true, canUpdate: true, canDelete: false, canExport: false },
      settings: NO_ACCESS,
      staff: NO_ACCESS,
      audit: VIEW_ONLY,
    },
  },
  "Fulfilment Manager": {
    modules: {
      overview: VIEW_ONLY,
      orders: { canView: true, canCreate: false, canUpdate: true, canDelete: false, canExport: true },
      products: VIEW_ONLY,
      inventory: { canView: true, canCreate: true, canUpdate: true, canDelete: false, canExport: true },
      customers: VIEW_ONLY,
      discounts: NO_ACCESS,
      shipping: ALL_ALLOWED,
      analytics: VIEW_ONLY,
      content: NO_ACCESS,
      settings: NO_ACCESS,
      staff: NO_ACCESS,
      audit: VIEW_ONLY,
    },
  },
  "Content Editor": {
    modules: {
      overview: VIEW_ONLY,
      orders: NO_ACCESS,
      products: { canView: true, canCreate: false, canUpdate: true, canDelete: false, canExport: false },
      inventory: VIEW_ONLY,
      customers: NO_ACCESS,
      discounts: VIEW_ONLY,
      shipping: NO_ACCESS,
      analytics: VIEW_ONLY,
      content: ALL_ALLOWED,
      settings: { canView: true, canCreate: false, canUpdate: true, canDelete: false, canExport: false },
      staff: NO_ACCESS,
      audit: VIEW_ONLY,
    },
  },
  "Read-only Analyst": {
    modules: {
      overview: VIEW_ONLY,
      orders: VIEW_ONLY,
      products: VIEW_ONLY,
      inventory: VIEW_ONLY,
      customers: { canView: true, canCreate: false, canUpdate: false, canDelete: false, canExport: false },
      discounts: VIEW_ONLY,
      shipping: VIEW_ONLY,
      analytics: { canView: true, canCreate: false, canUpdate: false, canDelete: false, canExport: true },
      content: VIEW_ONLY,
      settings: VIEW_ONLY,
      staff: NO_ACCESS,
      audit: VIEW_ONLY,
    },
  },
};

/**
 * Validates if a role can perform an action on a module.
 */
export function hasPermission(
  role: AdminRole,
  module: AdminModule,
  action: AdminAction
): boolean {
  const perms = ROLE_PERMISSIONS[role]?.modules[module];
  if (!perms) return false;

  switch (action) {
    case "view":
      return perms.canView;
    case "create":
      return perms.canCreate;
    case "update":
      return perms.canUpdate;
    case "delete":
      return perms.canDelete;
    case "export":
      return perms.canExport;
    default:
      return false;
  }
}

export class RbacPermissionError extends Error {
  constructor(public role: AdminRole, public module: AdminModule, public action: AdminAction) {
    super(`Access denied: role '${role}' is not authorized to '${action}' on '${module}'.`);
    this.name = "RbacPermissionError";
  }
}

export function assertPermission(role: AdminRole, module: AdminModule, action: AdminAction): void {
  if (!hasPermission(role, module, action)) {
    throw new RbacPermissionError(role, module, action);
  }
}
