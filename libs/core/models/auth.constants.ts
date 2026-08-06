export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  SUPPORT_AGENT: 'support-agent',
  INVENTORY_MANAGER: 'inventory-manager',
} as const;

export const PERMISSIONS = {
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_READ: 'orders.read',
  ORDERS_UPDATE: 'orders.update',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_READ: 'products.read',
  PRODUCTS_UPDATE: 'products.update',
  USERS_MANAGE: 'users.manage',
  USERS_READ: 'users.read',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
