"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/icon";
import type { MenuItem, Order } from "@/lib/types";
import { editableOrderStatuses, formatCurrency } from "./order-config";

type OrderItemsPanelProps = {
  menuItems: MenuItem[];
  onAddItem: (menuItemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  order: Order;
  working: boolean;
};

export function OrderItemsPanel({
  menuItems,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  order,
  working,
}: OrderItemsPanelProps) {
  const [menuItemId, setMenuItemId] = useState("");
  const editable = editableOrderStatuses.includes(order.status);
  const addableItems = useMemo(() => {
    const existingIds = new Set(order.items.map((item) => item.menuItemId));
    return menuItems.filter((item) => !existingIds.has(item.id));
  }, [menuItems, order.items]);

  return (
    <section className="overflow-hidden rounded-xl border border-[#ded2c1] bg-white shadow-sm">
      <header className="border-b border-[#ded2c1] bg-[#f7f1ea] px-5 py-4">
        <h2 className="text-lg font-extrabold text-stone-900">Order Items</h2>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left">
          <thead className="border-b border-stone-200 text-[11px] uppercase tracking-[0.08em] text-stone-600">
            <tr>
              <th className="px-5 py-3 font-bold">Item</th>
              <th className="w-32 px-4 py-3 text-center font-bold">Qty</th>
              <th className="w-32 px-4 py-3 text-right font-bold">Unit Price</th>
              <th className="w-32 px-5 py-3 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-stone-900">
                        {item.itemName}
                      </p>
                    </div>
                    {editable ? (
                      <button
                        type="button"
                        disabled={working || order.items.length === 1}
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${item.itemName}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Icon name="trash" className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-5 text-center">
                  {editable ? (
                    <div className="mx-auto inline-flex h-8 items-center rounded-full border border-[#d9cdbd] bg-[#fffaf5]">
                      <button
                        type="button"
                        disabled={working || item.quantity <= 1}
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease ${item.itemName} quantity`}
                        className="flex size-8 items-center justify-center text-stone-600 disabled:opacity-35"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={working || item.quantity >= 100}
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase ${item.itemName} quantity`}
                        className="flex size-8 items-center justify-center text-stone-600 disabled:opacity-35"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-stone-800">{item.quantity}</span>
                  )}
                </td>
                <td className="px-4 py-5 text-right text-sm text-stone-700">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-5 py-5 text-right text-sm font-extrabold text-stone-900">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editable && addableItems.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-stone-200 bg-[#fffcf8] p-4 sm:flex-row">
          <select
            value={menuItemId}
            onChange={(event) => setMenuItemId(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-[#d69a37]"
          >
            <option value="">Choose an available menu item</option>
            {addableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {formatCurrency(item.price)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!menuItemId || working}
            onClick={() => {
              onAddItem(menuItemId);
              setMenuItemId("");
            }}
            className="h-10 rounded-lg border border-[#d6a050] px-4 text-sm font-bold text-[#80591e] hover:bg-amber-50 disabled:opacity-50"
          >
            Add Item
          </button>
        </div>
      ) : null}
    </section>
  );
}
