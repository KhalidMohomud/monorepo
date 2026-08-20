export type Role = "ADMIN" | "STAFF";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
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
};

