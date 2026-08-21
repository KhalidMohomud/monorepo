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
      className={`relative flex min-h-[206px] flex-col rounded-lg border bg-white p-4 shadow-[0_3px_12px_rgba(71,52,28,0.06)] ${TABLE_CARD_STYLES[table.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#2d2925]">
            Table {formatTableNumber(table.tableNumber)}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#625b53]">
            <Icon name="seats" className="size-4" />
            {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${TABLE_STATUS_BADGE_STYLES[table.status]}`}
          >
            {TABLE_STATUS_LABELS[table.status]}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMenu(table.id)}
              aria-label={`Actions for table ${table.tableNumber}`}
              aria-expanded={menuOpen}
              className="flex size-7 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100"
            >
              <Icon name="more" className="size-4" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-8 z-10 w-28 rounded-lg border border-stone-200 bg-white p-1 shadow-lg">
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
        <div className="mt-3 flex items-center justify-between rounded-md bg-[#f5f0e9] px-3 py-2 text-xs">
          <span className="font-semibold text-[#49423a]">
            #ORD-{table.activeOrder.id.slice(0, 4).toUpperCase()}
          </span>
          <span className="font-bold text-[#7b571e]">
            {formatCurrency(table.activeOrder.total)}
          </span>
        </div>
      ) : (
        <div className="mt-3 min-h-8" />
      )}

      {/* Order actions remain disabled until their matching frontend screens exist. */}
      <div className="mt-auto pt-4">
        {table.status === "CLEANING" ? (
          <button
            type="button"
            disabled={updating}
            onClick={() => onMarkAvailable(table)}
            className="h-9 w-full rounded-lg bg-[#eda735] text-xs font-bold text-white transition hover:bg-[#d99729] disabled:opacity-60"
          >
            {updating ? "Updating…" : "Mark Available"}
          </button>
        ) : table.status === "RESERVED" ? (
          <button
            type="button"
            onClick={() => onEdit(table)}
            className="h-9 w-full rounded-lg border border-[#e1dad1] bg-white text-xs font-bold text-[#6c655d] hover:bg-stone-50"
          >
            Change Status
          </button>
        ) : (
          <button
            type="button"
            disabled
            title={
              table.status === "OCCUPIED"
                ? "Order details screen is coming next"
                : "Order creation screen is coming next"
            }
            className={`h-9 w-full cursor-not-allowed rounded-lg text-xs font-bold ${
              table.status === "AVAILABLE"
                ? "bg-[#eda735] text-white opacity-70"
                : "border border-[#e1dad1] bg-white text-[#6c655d] opacity-70"
            }`}
          >
            {table.status === "OCCUPIED" ? "View Order" : "Start Order"}
          </button>
        )}
      </div>
    </article>
  );
}
