import type { TableStatus } from "@/lib/types";

export type TableFilter = TableStatus | "ALL";

export type TableFormState = {
  capacity: string;
  status: TableStatus;
  tableNumber: string;
};

export const EMPTY_TABLE_FORM: TableFormState = {
  tableNumber: "",
  capacity: "",
  status: "AVAILABLE",
};

// Centralized labels and colors keep cards, filters, and forms consistent.
export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
};

export const TABLE_STATUS_BADGE_STYLES: Record<TableStatus, string> = {
  AVAILABLE: "bg-stone-100 text-stone-600",
  OCCUPIED: "bg-indigo-50 text-indigo-800",
  RESERVED: "bg-amber-50 text-amber-800",
  CLEANING: "bg-emerald-50 text-emerald-800",
};

export const TABLE_CARD_STYLES: Record<TableStatus, string> = {
  AVAILABLE: "border-[#e3ded7]",
  OCCUPIED: "border-indigo-200",
  RESERVED: "border-amber-200",
  CLEANING: "border-emerald-200",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatCurrency = (value: string) =>
  currencyFormatter.format(Number(value));

export const formatTableNumber = (tableNumber: number) =>
  String(tableNumber).padStart(2, "0");
