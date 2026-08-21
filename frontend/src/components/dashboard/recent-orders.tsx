import Link from "next/link";

import type { DashboardRecentOrder } from "@/lib/types";
import {
  formatCurrency,
  orderReference,
  orderStatusLabel,
  orderStatusStyle,
} from "@/components/orders/order-config";

type RecentOrdersProps = {
  loading: boolean;
  orders: DashboardRecentOrder[];
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function RecentOrders({ loading, orders }: RecentOrdersProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e1d9cf] bg-white shadow-[0_5px_18px_rgba(62,46,27,0.05)]">
      <header className="flex items-center justify-between border-b border-stone-200 px-5 py-5">
        <h2 className="text-2xl font-extrabold text-stone-900">Recent Orders</h2>
        <Link href="/orders" className="text-sm font-bold text-[#c38320]">
          View All
        </Link>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead className="text-[11px] uppercase tracking-wide text-stone-600">
            <tr>
              <th className="px-5 py-3 font-bold">Order</th>
              <th className="px-4 py-3 font-bold">Table</th>
              <th className="px-4 py-3 font-bold">Time</th>
              <th className="px-4 py-3 font-bold">Items</th>
              <th className="px-4 py-3 text-right font-bold">Total</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-5 py-3 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {loading ? (
              [0, 1, 2, 3].map((row) => (
                <tr key={row}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-7 animate-pulse rounded bg-stone-100" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-stone-500">
                  No orders have been created yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-5 py-4 text-sm font-extrabold text-stone-900">
                    {orderReference(order.id)}
                  </td>
                  <td className="px-4 py-4 text-sm text-stone-700">
                    T-{String(order.table.tableNumber).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-4 text-sm text-stone-600">
                    {timeFormatter.format(new Date(order.createdAt))}
                  </td>
                  <td className="px-4 py-4 text-sm text-stone-700">
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-stone-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${orderStatusStyle[order.status]}`}>
                      {orderStatusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/orders?orderId=${order.id}`}
                      className="text-xs font-bold text-[#c38320] hover:text-[#8a5d1d]"
                    >
                      View
                    </Link>
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
