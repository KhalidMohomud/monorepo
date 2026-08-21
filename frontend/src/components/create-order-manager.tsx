"use client";

import Link from "next/link";

import { Icon } from "./icon";
import { MenuPicker } from "./orders/create-order/menu-picker";
import { OrderSummary } from "./orders/create-order/order-summary";
import { TableSelector } from "./orders/create-order/table-selector";
import { useCreateOrder } from "./orders/create-order/use-create-order";

// The manager composes the order workflow while each visual section stays isolated.
export function CreateOrderManager() {
  const order = useCreateOrder();
  const selectedTable =
    order.tables.find((table) => table.id === order.selectedTableId) ?? null;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
      <div className="mx-auto max-w-[1420px]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a66d18]">
              Orders
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
              Create Order
            </h1>
            <p className="mt-1.5 text-sm text-stone-600">
              Select a table and add available menu items.
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-50"
          >
            <Icon name="chevron-right" className="size-4 rotate-180" />
            Orders
          </Link>
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-stone-700">Choose a table</h2>
          <TableSelector
            loading={order.loading}
            onSelect={order.setSelectedTableId}
            selectedId={order.selectedTableId}
            tables={order.tables}
          />
        </section>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <MenuPicker
            categories={order.categories}
            category={order.category}
            items={order.filteredMenuItems}
            loading={order.loading}
            onAdd={order.addItem}
            onCategoryChange={order.setCategory}
            onQueryChange={order.setQuery}
            query={order.query}
          />
          <OrderSummary
            itemCount={order.itemCount}
            items={order.draftItems}
            onCreate={() => void order.createOrder()}
            onRemove={order.removeItem}
            onUpdateQuantity={order.updateQuantity}
            saving={order.saving}
            selectedTable={selectedTable}
            subtotal={order.subtotal}
          />
        </div>
      </div>
    </main>
  );
}
