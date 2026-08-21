import { TABLE_STATUSES, type RestaurantTable } from "@/lib/types";
import { TABLE_STATUS_LABELS, type TableFilter } from "./table-config";

type TableFiltersProps = {
  filter: TableFilter;
  onChange: (filter: TableFilter) => void;
  tables: RestaurantTable[];
};

const getFilterStyle = (filter: TableFilter, active: boolean) => {
  if (!active) {
    return "border-[#e3ddd5] bg-[#f4f2ef] text-[#6c655d] hover:bg-white";
  }

  switch (filter) {
    case "OCCUPIED":
      return "border-indigo-200 bg-indigo-50 text-indigo-900";
    case "RESERVED":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "CLEANING":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    default:
      return "border-[#d9cfc3] bg-white text-[#2f2b26] shadow-sm";
  }
};

// Counts are derived from the loaded collection; no extra API request is needed.
export function TableFilters({ filter, onChange, tables }: TableFiltersProps) {
  const options: Array<{ count: number; label: string; value: TableFilter }> = [
    { label: "All", value: "ALL", count: tables.length },
    ...TABLE_STATUSES.map((status) => ({
      label: TABLE_STATUS_LABELS[status],
      value: status,
      count: tables.filter((table) => table.status === status).length,
    })),
  ];

  return (
    <div
      className="mt-5 flex gap-2 overflow-x-auto pb-1"
      aria-label="Filter tables by status"
    >
      {options.map((option) => {
        const active = filter === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`shrink-0 rounded-full border px-3.5 py-1 text-xs font-semibold transition ${getFilterStyle(option.value, active)}`}
          >
            {option.label} ({option.count})
          </button>
        );
      })}
    </div>
  );
}
