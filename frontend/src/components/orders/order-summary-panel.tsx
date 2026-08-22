import { Icon } from "@/components/icon";
import { canApplyOrderStatus } from "@/lib/permissions";
import type { Order, OrderStatus, Role } from "@/lib/types";
import {
  cancellableOrderStatuses,
  formatCurrency,
  nextOrderStatus,
  nextStatusAction,
} from "./order-config";

type OrderSummaryPanelProps = {
  onAdvance: (status: OrderStatus) => void;
  onCancelOrder: () => void;
  order: Order;
  role: Role | null;
  working: boolean;
};

export function OrderSummaryPanel({
  onAdvance,
  onCancelOrder,
  order,
  role,
  working,
}: OrderSummaryPanelProps) {
  const nextStatus = nextOrderStatus[order.status];
  const allowedNextStatus =
    nextStatus && canApplyOrderStatus(role, nextStatus) ? nextStatus : null;
  const cancellable =
    cancellableOrderStatuses.includes(order.status) &&
    canApplyOrderStatus(role, "CANCELLED");

  return (
    <aside>
      <section className="rounded-xl border border-[#ded2c1] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-extrabold text-stone-900">Order Summary</h2>
        <div className="mt-3 border-y border-stone-200 py-4">
          <div className="flex items-center justify-between text-sm text-stone-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-5 text-2xl font-extrabold text-stone-900">
          <span>Total</span>
          <span className="text-[#79541c]">{formatCurrency(order.total)}</span>
        </div>
      </section>

      {allowedNextStatus ? (
        <button
          type="button"
          disabled={working}
          onClick={() => onAdvance(allowedNextStatus)}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#eda735] px-5 text-sm font-extrabold text-[#604619] shadow-sm hover:bg-[#df9928] disabled:opacity-50"
        >
          <span className="flex size-5 items-center justify-center rounded-full border-2 border-current">
            <Icon name="check" className="size-3" />
          </span>
          {working ? "Updating…" : nextStatusAction[order.status]}
        </button>
      ) : null}

      {cancellable ? (
        <button
          type="button"
          disabled={working}
          onClick={onCancelOrder}
          className="mt-4 h-10 w-full text-sm font-bold text-red-700 hover:text-red-800 disabled:opacity-50"
        >
          Cancel Order
        </button>
      ) : null}
    </aside>
  );
}
