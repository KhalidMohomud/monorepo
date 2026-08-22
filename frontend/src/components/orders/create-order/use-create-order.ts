"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { getErrorMessage } from "@/lib/api";
import { menuItemApi, orderApi, restaurantTableApi } from "@/lib/domain-api";
import { canCreateOrders } from "@/lib/permissions";
import type { MenuItem, RestaurantTable } from "@/lib/types";

export type DraftOrderItem = {
  menuItem: MenuItem;
  quantity: number;
};

export function useCreateOrder() {
  const router = useRouter();
  const { token, user } = useAuth();
  const toast = useToast();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);
  const [category, setCategory] = useState("All Items");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [tableResponse, menuResponse] = await Promise.all([
        restaurantTableApi.list(token),
        menuItemApi.list(token),
      ]);
      setTables(tableResponse.data.tables);
      const requestedTableId = new URLSearchParams(window.location.search).get(
        "tableId",
      );
      const requestedTable = tableResponse.data.tables.find(
        (table) =>
          table.id === requestedTableId &&
          !table.activeOrder &&
          (table.status === "AVAILABLE" || table.status === "RESERVED"),
      );
      setSelectedTableId((current) => current ?? requestedTable?.id ?? null);
      // Admin responses include unavailable items, but orders must not offer them.
      setMenuItems(menuResponse.data.menuItems.filter((item) => item.isAvailable));
    } catch (error) {
      toast.error(getErrorMessage(error), "Unable to load order setup");
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const categories = useMemo(
    () => [
      "All Items",
      ...Array.from(new Set(menuItems.map((item) => item.category.name))).sort(),
    ],
    [menuItems],
  );

  const filteredMenuItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory =
        category === "All Items" || item.category.name === category;
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery);

      return matchesCategory && Boolean(matchesQuery);
    });
  }, [category, menuItems, query]);

  const addItem = (menuItem: MenuItem) => {
    setDraftItems((current) => {
      const existing = current.find((item) => item.menuItem.id === menuItem.id);

      if (existing) {
        return current.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: Math.min(item.quantity + 1, 100) }
            : item,
        );
      }

      return [...current, { menuItem, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity < 1) {
      setDraftItems((current) =>
        current.filter((item) => item.menuItem.id !== menuItemId),
      );
      return;
    }

    setDraftItems((current) =>
      current.map((item) =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity: Math.min(quantity, 100) }
          : item,
      ),
    );
  };

  const removeItem = (menuItemId: string) => {
    setDraftItems((current) =>
      current.filter((item) => item.menuItem.id !== menuItemId),
    );
  };

  const subtotal = draftItems.reduce(
    (total, item) => total + Number(item.menuItem.price) * item.quantity,
    0,
  );
  const itemCount = draftItems.reduce((total, item) => total + item.quantity, 0);

  const createOrder = async () => {
    if (
      !token ||
      !canCreateOrders(user?.role) ||
      !selectedTableId ||
      draftItems.length === 0
    ) {
      return;
    }

    setSaving(true);
    try {
      await orderApi.create(
        token,
        selectedTableId,
        draftItems.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
      );
      toast.success("The order was created and linked to the selected table.");
      router.push("/orders");
    } catch (error) {
      toast.error(getErrorMessage(error), "Unable to create order");
    } finally {
      setSaving(false);
    }
  };

  return {
    addItem,
    categories,
    category,
    createOrder,
    draftItems,
    filteredMenuItems,
    itemCount,
    loading,
    menuItems,
    query,
    removeItem,
    saving,
    selectedTableId,
    setCategory,
    setQuery,
    setSelectedTableId,
    subtotal,
    tables,
    updateQuantity,
  };
}
