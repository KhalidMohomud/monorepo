"use client";

import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "./confirm-dialog";
import { Icon } from "./icon";
import { OrderDetailView } from "./orders/order-detail-view";
import { OrderTable } from "./orders/order-table";
import { OrderToolbar } from "./orders/order-toolbar";
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
          canEditItems={orderState.canEditItems}
          onAddItem={(menuItemId) => void orderState.addItem(menuItemId)}
          onAdvance={(status) => void orderState.updateStatus(status)}
          onBack={orderState.closeOrder}
          onCancelOrder={() => setCancelConfirmationOpen(true)}
          onRemoveItem={(itemId) => void orderState.removeItem(itemId)}
          onUpdateQuantity={(itemId, quantity) =>
            void orderState.updateItemQuantity(itemId, quantity)
          }
          order={orderState.selectedOrder}
          role={orderState.userRole}
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
                {orderState.canViewHistory
                  ? "Manage active orders and review completed order history."
                  : "Manage the restaurant's active orders."}
              </p>
            </div>
            {orderState.canCreateOrder ? (
              <Link
                href="/orders/new"
                className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#eda735] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#d99729] sm:self-auto"
              >
                <Icon name="plus" className="size-4" />
                New Order
              </Link>
            ) : null}
          </div>

          <OrderToolbar
            canViewHistory={orderState.canViewHistory}
            onQueryChange={orderState.setQuery}
            onViewChange={orderState.setView}
            query={orderState.query}
            view={orderState.view}
          />

          <div className="mt-4">
            <OrderTable
              loading={orderState.loading}
              onOpen={orderState.openOrder}
              orders={orderState.filteredOrders}
              query={orderState.query}
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
