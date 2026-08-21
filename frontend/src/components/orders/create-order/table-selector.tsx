import { Icon } from "@/components/icon";
import type { RestaurantTable } from "@/lib/types";

type TableSelectorProps = {
  loading: boolean;
  onSelect: (id: string) => void;
  selectedId: string | null;
  tables: RestaurantTable[];
};

const tableStatusLabel = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
};

const tableStatusStyle = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  OCCUPIED: "bg-indigo-50 text-indigo-700",
  RESERVED: "bg-amber-50 text-amber-700",
  CLEANING: "bg-sky-50 text-sky-700",
};

export function TableSelector({
  loading,
  onSelect,
  selectedId,
  tables,
}: TableSelectorProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl bg-stone-200/70" />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white px-5 py-7 text-sm text-stone-500">
        No restaurant tables are configured.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tables.map((table) => {
        const ready =
          !table.activeOrder &&
          (table.status === "AVAILABLE" || table.status === "RESERVED");
        const selected = table.id === selectedId;

        return (
          <button
            key={table.id}
            type="button"
            disabled={!ready}
            onClick={() => onSelect(table.id)}
            className={`rounded-xl border p-4 text-left transition ${
              selected
                ? "border-[#93641f] bg-[#fff7ea] shadow-[0_0_0_1px_#93641f]"
                : ready
                  ? "border-[#ded4c7] bg-white hover:border-[#d2a65d] hover:shadow-sm"
                  : "cursor-not-allowed border-[#e1d9cf] bg-[#eee9e2] opacity-65"
            }`}
          >
            <span className="flex items-start justify-between gap-2">
              <strong className="text-lg text-stone-900">
                Table {String(table.tableNumber).padStart(2, "0")}
              </strong>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                  selected
                    ? "bg-emerald-100 text-emerald-800"
                    : tableStatusStyle[table.status]
                }`}
              >
                {selected ? "Selected" : tableStatusLabel[table.status]}
              </span>
            </span>
            <span className="mt-2 flex items-center gap-1.5 text-sm text-stone-600">
              <Icon name="seats" className="size-4" />
              {table.capacity} seats
            </span>
          </button>
        );
      })}
    </div>
  );
}
