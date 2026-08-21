import { Icon } from "@/components/icon";
import type { MenuItem, Order, OrderStatus } from "@/lib/types";
import {
  formatOrderDate,
  orderReference,
  orderStatusLabel,
  orderStatusStyle,
} from "./order-config";
import { OrderItemsPanel } from "./order-items-panel";
import { OrderStatusTimeline } from "./order-status-timeline";
import { OrderSummaryPanel } from "./order-summary-panel";

type OrderDetailViewProps = {
  menuItems: MenuItem[];
  onAddItem: (menuItemId: string) => void;
  onAdvance: (status: OrderStatus) => void;
  onBack: () => void;
  onCancelOrder: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  order: Order;
  working: boolean;
};

export function OrderDetailView({
  menuItems,
  onAddItem,
  onAdvance,
  onBack,
  onCancelOrder,
  onRemoveItem,
  onUpdateQuantity,
  order,
  working,
}: OrderDetailViewProps) {
  return (
    <div className="mx-auto max-w-[1240px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-[#865c1e]"
      >
        <Icon name="chevron-right" className="size-4 rotate-180" />
        Back to orders
      </button>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-[#ded2c1] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                    Order {orderReference(order.id)}
                  </h1>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${orderStatusStyle[order.status]}`}
                  >
                    {orderStatusLabel[order.status]}
                  </span>
                </div>
                <p className="mt-1 text-xl font-bold text-stone-700">
                  Table {String(order.table.tableNumber).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  Created {formatOrderDate(order.createdAt)} by {order.createdBy.name}
                </p>
              </div>
            </div>

            <OrderStatusTimeline status={order.status} />
          </section>

          <OrderItemsPanel
            menuItems={menuItems}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            onUpdateQuantity={onUpdateQuantity}
            order={order}
            working={working}
          />
        </div>

        <OrderSummaryPanel
          onAdvance={onAdvance}
          onCancelOrder={onCancelOrder}
          order={order}
          working={working}
        />
      </div>
    </div>
  );
}
