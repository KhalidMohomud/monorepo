"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { getErrorMessage } from "@/lib/api";
import { menuItemApi, orderApi } from "@/lib/domain-api";
import type { MenuItem, Order, OrderStatus } from "@/lib/types";
import { orderReference, orderStatusLabel } from "./order-config";

export type OrderView = "ACTIVE" | "HISTORY";

export function useOrders() {
  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();
  const [view, setView] = useState<OrderView>("ACTIVE");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [orderResponse, menuResponse] = await Promise.all([
        orderApi.list(token, view === "ACTIVE"),
        menuItemApi.list(token),
      ]);
      const loadedOrders = orderResponse.data.orders;
      setOrders(loadedOrders);
      const requestedOrderId = new URLSearchParams(window.location.search).get(
        "orderId",
      );
      setSelectedOrder(
        loadedOrders.find((order) => order.id === requestedOrderId) ?? null,
      );
      setMenuItems(menuResponse.data.menuItems.filter((item) => item.isAvailable));
    } catch (error) {
      toast.error(getErrorMessage(error), "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, [toast, token, view]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadOrders(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOrders]);

  const changeView = (nextView: OrderView) => {
    setSelectedOrder(null);
    router.replace("/orders");
    setView(nextView);
  };

  const closeOrder = () => {
    setSelectedOrder(null);
    router.replace("/orders");
  };

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return orders;

    return orders.filter((order) => {
      const tableNumber = String(order.table.tableNumber);
      const searchableValues = [
        order.id,
        orderReference(order.id),
        tableNumber,
        `table ${tableNumber}`,
        `t-${tableNumber.padStart(2, "0")}`,
        order.status,
        orderStatusLabel[order.status],
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [orders, query]);

  const syncOrder = (updatedOrder: Order) => {
    setSelectedOrder(updatedOrder);
    setOrders((current) =>
      current.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order,
      ),
    );
  };

  const runOrderMutation = async (
    mutation: () => Promise<{ data: { order: Order } }>,
    successMessage: string,
  ) => {
    setWorking(true);
    try {
      const response = await mutation();
      syncOrder(response.data.order);
      toast.success(successMessage);
      return response.data.order;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return null;
    } finally {
      setWorking(false);
    }
  };

  const addItem = async (menuItemId: string) => {
    if (!token || !selectedOrder) return;
    await runOrderMutation(
      () => orderApi.addItem(token, selectedOrder.id, { menuItemId, quantity: 1 }),
      "Menu item added to the order.",
    );
  };

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (!token || !selectedOrder) return;
    await runOrderMutation(
      () => orderApi.updateItem(token, selectedOrder.id, itemId, quantity),
      "Item quantity updated.",
    );
  };

  const removeItem = async (itemId: string) => {
    if (!token || !selectedOrder) return;
    await runOrderMutation(
      () => orderApi.removeItem(token, selectedOrder.id, itemId),
      "Menu item removed from the order.",
    );
  };

  const updateStatus = async (status: OrderStatus) => {
    if (!token || !selectedOrder) return;

    const updatedOrder = await runOrderMutation(
      () => orderApi.updateStatus(token, selectedOrder.id, status),
      `Order status changed to ${status.toLowerCase()}.`,
    );

    // Paid and cancelled orders leave the active list immediately.
    if (updatedOrder && (status === "PAID" || status === "CANCELLED")) {
      setOrders((current) => current.filter((order) => order.id !== updatedOrder.id));
      setSelectedOrder(null);
    }
  };

  return {
    addItem,
    closeOrder,
    filteredOrders,
    loading,
    menuItems,
    openOrder: setSelectedOrder,
    orders,
    query,
    removeItem,
    selectedOrder,
    setQuery,
    setView: changeView,
    updateItemQuantity,
    updateStatus,
    view,
    working,
  };
}
