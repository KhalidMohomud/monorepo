export type Role = "ADMIN" | "STAFF";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type UserAccount = AuthUser & {
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  menuItemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
};

export const TABLE_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
] as const;

export type TableStatus = (typeof TABLE_STATUSES)[number];

export type RestaurantTable = {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
  activeOrder: {
    id: string;
    status: "PENDING" | "PREPARING" | "READY" | "SERVED";
    total: string;
    createdAt: string;
  } | null;
};

export const ORDER_STATUSES = [
  "PENDING",
  "PREPARING",
  "READY",
  "SERVED",
  "PAID",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  createdAt: string;
};

export type Order = {
  id: string;
  tableId: string;
  createdById: string;
  status: OrderStatus;
  subtotal: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  table: Pick<RestaurantTable, "id" | "tableNumber" | "capacity" | "status">;
  createdBy: AuthUser;
  items: OrderItem[];
};

export type DashboardRecentOrder = {
  id: string;
  status: OrderStatus;
  total: string;
  createdAt: string;
  itemCount: number;
  table: { id: string; tableNumber: number };
};

export type DashboardOverview = {
  summary: {
    occupiedTables: number;
    totalTables: number;
    activeOrders: number;
    todayOrders: number;
    todayRevenue: string;
  };
  activeOrdersByStatus: Record<
    "PENDING" | "PREPARING" | "READY" | "SERVED",
    number
  >;
  recentOrders: DashboardRecentOrder[];
};
