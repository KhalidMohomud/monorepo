import type { Role } from "@/lib/types";

export type UserFilter = Role | "ALL";

export type UserFormState = {
  email: string;
  name: string;
  password: string;
  role: Role;
};

export const EMPTY_USER_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  role: "WAITER",
};

export const USER_ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  WAITER: "Waiter",
  CASHIER: "Cashier",
};

export const USER_ROLE_STYLES: Record<Role, string> = {
  ADMIN: "bg-indigo-50 text-indigo-700",
  WAITER: "bg-emerald-50 text-emerald-700",
  CASHIER: "bg-amber-50 text-amber-800",
};
