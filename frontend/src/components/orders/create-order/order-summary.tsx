import { Icon } from "@/components/icon";
import type { RestaurantTable } from "@/lib/types";
import { formatCurrency } from "../order-config";
import type { DraftOrderItem } from "./use-create-order";

type OrderSummaryProps = {
  itemCount: number;
  items: DraftOrderItem[];
  onCreate: () => void;
  onRemove: (menuItemId: string) => void;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  saving: boolean;
  selectedTable: RestaurantTable | null;
  subtotal: number;
};

export function OrderSummary({
  itemCount,
  items,
  onCreate,
  onRemove,
  onUpdateQuantity,
  saving,
  selectedTable,
  subtotal,
}: OrderSummaryProps) {
  const canCreate = Boolean(selectedTable) && items.length > 0 && !saving;

  return (
    <aside className="flex min-h-[480px] flex-col rounded-2xl border border-[#ded4c7] bg-white shadow-sm">
      <div className="border-b border-[#e3d9cc] px-5 py-4">
        <h2 className="text-xl font-extrabold text-stone-900">Current Order</h2>
        <p className="mt-0.5 text-sm font-bold text-[#8a5d1d]">
          {selectedTable
            ? `Table ${String(selectedTable.tableNumber).padStart(2, "0")}`
            : "Select a table"}
        </p>
      </div>

      <div className="flex-1 divide-y divide-stone-100 px-4">
        {items.length === 0 ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Icon name="receipt" className="size-6" />
            </span>
            <p className="mt-3 font-bold text-stone-700">Your order is empty</p>
            <p className="mt-1 max-w-52 text-sm text-stone-500">
              Add available menu items to begin the order.
            </p>
          </div>
        ) : (
          items.map(({ menuItem, quantity }) => (
            <div key={menuItem.id} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-stone-900">
                    {menuItem.name}
                  </p>
                  <div className="mt-2 inline-flex h-9 items-center rounded-full border border-[#d9cdbd] bg-[#fffaf5]">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(menuItem.id, quantity - 1)}
                      aria-label={`Decrease ${menuItem.name} quantity`}
                      className="flex size-9 items-center justify-center text-lg text-stone-600"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(menuItem.id, quantity + 1)}
                      disabled={quantity >= 100}
                      aria-label={`Increase ${menuItem.name} quantity`}
                      className="flex size-9 items-center justify-center text-lg text-stone-600 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-stone-900">
                    {formatCurrency(Number(menuItem.price) * quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemove(menuItem.id)}
                    aria-label={`Remove ${menuItem.name}`}
                    className="flex size-8 items-center justify-center rounded-md text-stone-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Icon name="close" className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[#e3d9cc] bg-[#fffaf5] p-4">
        <div className="flex justify-between text-sm text-stone-600">
          <span>Items: {itemCount}</span>
          <span>Subtotal: {formatCurrency(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xl font-extrabold text-stone-900">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <button
          type="button"
          disabled={!canCreate}
          onClick={onCreate}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f4a20d] text-base font-extrabold text-[#5b4119] shadow-sm transition hover:bg-[#e79705] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Order"}
          {!saving ? <Icon name="chevron-right" className="size-5" /> : null}
        </button>
      </div>
    </aside>
  );
}
