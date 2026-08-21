import Link from "next/link";

import type { RestaurantTable } from "@/lib/types";
import { Icon } from "../icon";
import {
  formatCurrency,
  formatTableNumber,
  TABLE_CARD_STYLES,
  TABLE_STATUS_BADGE_STYLES,
  TABLE_STATUS_LABELS,
} from "./table-config";

type TableCardProps = {
  menuOpen: boolean;
  onDelete: (table: RestaurantTable) => void;
  onEdit: (table: RestaurantTable) => void;
  onMarkAvailable: (table: RestaurantTable) => void;
  onToggleMenu: (tableId: string) => void;
  table: RestaurantTable;
  updating: boolean;
};

export function TableCard({
  menuOpen,
  onDelete,
  onEdit,
  onMarkAvailable,
  onToggleMenu,
  table,
  updating,
}: TableCardProps) {
  return (
    <article
      className={`relative flex min-h-[270px] flex-col rounded-xl border bg-white p-5 shadow-[0_5px_18px_rgba(71,52,28,0.06)] ${TABLE_CARD_STYLES[table.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#2d2925]">
            Table {formatTableNumber(table.tableNumber)}
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-[#625b53]">
            <Icon name="seats" className="size-5" />
            {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${TABLE_STATUS_BADGE_STYLES[table.status]}`}
          >
            {TABLE_STATUS_LABELS[table.status]}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMenu(table.id)}
              aria-label={`Actions for table ${table.tableNumber}`}
              aria-expanded={menuOpen}
              className="flex size-9 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100"
            >
              <Icon name="more" className="size-5" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-10 z-10 w-32 rounded-lg border border-stone-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => onEdit(table)}
                  className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(table)}
                  className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {table.activeOrder ? (
        <div className="mt-5 flex items-center justify-between rounded-lg bg-[#f5f0e9] px-4 py-3 text-sm">
          <span className="font-semibold text-[#49423a]">
            #ORD-{table.activeOrder.id.slice(0, 4).toUpperCase()}
          </span>
          <span className="font-bold text-[#7b571e]">
            {formatCurrency(table.activeOrder.total)}
          </span>
        </div>
      ) : (
        <div className="mt-5 min-h-11" />
      )}

      <div className="mt-auto pt-5">
        {table.status === "CLEANING" ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => onMarkAvailable(table)}
            className="h-12 w-full rounded-xl bg-[#eda735] text-sm font-bold text-white transition hover:bg-[#d99729] disabled:opacity-60"
          >
            {updating ? "Updating…" : "Mark Available"}
          </button>
        ) : table.status === "RESERVED" ? (
          <button
            type="button"
            onClick={() => onEdit(table)}
            className="h-12 w-full rounded-xl border border-[#e1dad1] bg-white text-sm font-bold text-[#6c655d] hover:bg-stone-50"
          >
            Change Status
          </button>
        ) : table.status === "AVAILABLE" ? (
          <Link
            href={`/orders/new?tableId=${table.id}`}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#efb24e] text-sm font-bold text-white transition hover:bg-[#e4a339]"
          >
            Start Order
          </Link>
        ) : table.activeOrder ? (
          <Link
            href={`/orders?orderId=${table.activeOrder.id}`}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-[#ddd8d0] bg-white text-sm font-bold text-[#6c655d] transition hover:border-[#c9bca9] hover:bg-stone-50"
          >
            View Order
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="h-12 w-full cursor-not-allowed rounded-xl border border-[#ddd8d0] bg-white text-sm font-bold text-[#9b9690]"
          >
            View Order
          </button>
        )}
      </div>
    </article>
  );
}
