import type { RestaurantTable } from "@/lib/types";
import { Icon } from "../icon";
import { TableCard } from "./table-card";
import { TABLE_STATUS_LABELS, type TableFilter } from "./table-config";

type TableGridProps = {
  filter: TableFilter;
  loading: boolean;
  menuTableId: string | null;
  onDelete: (table: RestaurantTable) => void;
  onEdit: (table: RestaurantTable) => void;
  onMarkAvailable: (table: RestaurantTable) => void;
  onToggleMenu: (tableId: string) => void;
  tables: RestaurantTable[];
  totalTableCount: number;
  updatingId: string | null;
};

function LoadingGrid() {
  return (
    <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-[270px] animate-pulse rounded-xl border border-[#e4ded6] bg-white p-5"
        >
          <div className="h-5 w-24 rounded bg-stone-200" />
          <div className="mt-4 h-4 w-16 rounded bg-stone-100" />
          <div className="mt-24 h-11 rounded bg-stone-100" />
        </div>
      ))}
    </section>
  );
}

function EmptyTables({
  filter,
  totalTableCount,
}: Pick<TableGridProps, "filter" | "totalTableCount">) {
  const emptyTitle =
    totalTableCount === 0
      ? "No tables configured"
      : `No ${filter === "ALL" ? "matching" : TABLE_STATUS_LABELS[filter].toLowerCase()} tables`;

  return (
    <section className="mt-7 rounded-xl border border-dashed border-[#d8cec2] bg-white px-6 py-16 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <Icon name="table" className="size-6" />
      </div>
      <h2 className="mt-4 font-bold text-[#302c27]">{emptyTitle}</h2>
      <p className="mt-1 text-sm text-[#756d64]">
        {totalTableCount === 0
          ? "Add your first dining table to begin managing the floor."
          : "Choose another status filter to view tables."}
      </p>
    </section>
  );
}

// TableGrid owns collection states; TableCard owns one table's presentation.
export function TableGrid(props: TableGridProps) {
  if (props.loading) {
    return <LoadingGrid />;
  }

  if (props.tables.length === 0) {
    return (
      <EmptyTables
        filter={props.filter}
        totalTableCount={props.totalTableCount}
      />
    );
  }

  return (
    <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {props.tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          menuOpen={props.menuTableId === table.id}
          updating={props.updatingId === table.id}
          onDelete={props.onDelete}
          onEdit={props.onEdit}
          onMarkAvailable={props.onMarkAvailable}
          onToggleMenu={props.onToggleMenu}
        />
      ))}
    </section>
  );
}
