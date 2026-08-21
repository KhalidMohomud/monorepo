import { Icon } from "@/components/icon";
import type { Order } from "@/lib/types";
import {
  formatCurrency,
  formatOrderDate,
  orderReference,
  orderStatusLabel,
  orderStatusStyle,
} from "./order-config";
import type { OrderView } from "./use-orders";

type OrderTableProps = {
  loading: boolean;
  onOpen: (order: Order) => void;
  orders: Order[];
  view: OrderView;
};

export function OrderTable({ loading, onOpen, orders, view }: OrderTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#ded4c7] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left">
          <thead className="border-b border-[#e7ded3] bg-[#fffaf5] text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-5 py-4 font-bold">Order</th>
              <th className="px-5 py-4 font-bold">Table</th>
              <th className="px-5 py-4 font-bold">Created</th>
              <th className="px-5 py-4 font-bold">Items</th>
              <th className="px-5 py-4 font-bold">Total</th>
              <th className="px-5 py-4 font-bold">Status</th>
              <th className="px-5 py-4 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              [0, 1, 2].map((row) => (
                <tr key={row}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-9 animate-pulse rounded-lg bg-stone-100" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                    <Icon name={view === "ACTIVE" ? "receipt" : "history"} className="size-6" />
                  </span>
                  <p className="mt-3 font-bold text-stone-700">
                    {view === "ACTIVE" ? "No active orders" : "No order history"}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {view === "ACTIVE"
                      ? "New orders will appear here."
                      : "Paid and cancelled orders will appear here."}
                  </p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#fffcf8]">
                  <td className="px-5 py-4 text-sm font-extrabold text-stone-900">
                    {orderReference(order.id)}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-stone-700">
                    Table {String(order.table.tableNumber).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-600">
                    {formatOrderDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-600">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-stone-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${orderStatusStyle[order.status]}`}>
                      {orderStatusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpen(order)}
                      className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:border-[#d6a050] hover:text-[#8a5d1d]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
