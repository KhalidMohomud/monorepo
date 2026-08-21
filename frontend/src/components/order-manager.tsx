"use client";

import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "./confirm-dialog";
import { Icon } from "./icon";
import { OrderDetailView } from "./orders/order-detail-view";
import { OrderTable } from "./orders/order-table";
import { useOrders } from "./orders/use-orders";

// Orders remain one section: list/history plus a focused detail view.
export function OrderManager() {
  const orderState = useOrders();
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);

  const confirmCancellation = async () => {
    await orderState.updateStatus("CANCELLED");
    setCancelConfirmationOpen(false);
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
      {orderState.selectedOrder ? (
        <OrderDetailView
          menuItems={orderState.menuItems}
          onAddItem={(menuItemId) => void orderState.addItem(menuItemId)}
          onAdvance={(status) => void orderState.updateStatus(status)}
          onBack={orderState.closeOrder}
          onCancelOrder={() => setCancelConfirmationOpen(true)}
          onRemoveItem={(itemId) => void orderState.removeItem(itemId)}
          onUpdateQuantity={(itemId, quantity) =>
            void orderState.updateItemQuantity(itemId, quantity)
          }
          order={orderState.selectedOrder}
          working={orderState.working}
        />
      ) : (
        <div className="mx-auto max-w-[1380px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a66d18]">
              Restaurant operations
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
              Orders
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-stone-600">
              Manage active orders and review completed order history.
            </p>
          </div>
          <Link
            href="/orders/new"
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#eda735] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#d99729] sm:self-auto"
          >
            <Icon name="plus" className="size-4" />
            New Order
          </Link>
        </div>

        <div className="mt-7 inline-flex rounded-xl border border-[#ded4c7] bg-white p-1">
          {(["ACTIVE", "HISTORY"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => orderState.setView(view)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                orderState.view === view
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {view === "ACTIVE" ? "Active Orders" : "Order History"}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <OrderTable
            loading={orderState.loading}
            onOpen={orderState.openOrder}
            orders={orderState.orders}
            view={orderState.view}
          />
        </div>
        </div>
      )}

      <ConfirmDialog
        confirmLabel="Cancel Order"
        description="This order will move to cancelled history and its table will become available."
        loading={orderState.working}
        loadingLabel="Cancelling…"
        onCancel={() => setCancelConfirmationOpen(false)}
        onConfirm={() => void confirmCancellation()}
        open={cancelConfirmationOpen}
        title="Cancel this order?"
      />
    </main>
  );
}
