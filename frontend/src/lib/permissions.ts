import type { OrderStatus, Role } from "./types";

export const ADMIN_ONLY_ROLES: readonly Role[] = ["ADMIN"];
export const ORDER_ENTRY_ROLES: readonly Role[] = ["ADMIN", "WAITER"];

const waiterStatusTargets: readonly OrderStatus[] = [
  "PREPARING",
  "READY",
  "SERVED",
];
const cashierStatusTargets: readonly OrderStatus[] = ["PAID", "CANCELLED"];

export const landingPageForRole = (role: Role): string => {
  if (role === "ADMIN") return "/";
  if (role === "CASHIER") return "/orders";
  return "/orders/new";
};

export const canCreateOrders = (role: Role | null | undefined): boolean =>
  role === "ADMIN" || role === "WAITER";

export const canManageOrderItems = canCreateOrders;

export const canManageTables = (role: Role | null | undefined): boolean =>
  role === "ADMIN" || role === "WAITER";

export const canViewOrderHistory = (
  role: Role | null | undefined,
): boolean => role === "ADMIN";

export const canApplyOrderStatus = (
  role: Role | null | undefined,
  status: OrderStatus,
): boolean => {
  if (role === "ADMIN") return true;
  if (role === "WAITER") return waiterStatusTargets.includes(status);
  if (role === "CASHIER") return cashierStatusTargets.includes(status);
  return false;
};
