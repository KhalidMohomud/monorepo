import type { OrderStatus } from "@/lib/types";

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const orderStatusStyle: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  PREPARING: "bg-orange-50 text-orange-700 ring-orange-200",
  READY: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SERVED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  PAID: "bg-green-50 text-green-700 ring-green-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
};

export const nextOrderStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
  SERVED: "PAID",
};

export const nextStatusAction: Partial<Record<OrderStatus, string>> = {
  PENDING: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Mark Served",
  SERVED: "Mark Paid",
};

export const editableOrderStatuses: OrderStatus[] = ["PENDING", "PREPARING"];
export const cancellableOrderStatuses: OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "READY",
];

export const formatCurrency = (value: string | number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));

export const formatOrderDate = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const orderReference = (id: string): string =>
  `#ORD-${id.slice(0, 4).toUpperCase()}`;
