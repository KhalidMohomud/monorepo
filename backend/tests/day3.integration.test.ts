import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";

import { assertIsolatedTestDatabase } from "./test-database-safety.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";
process.env.FRONTEND_URL = "http://localhost:3000";

const testDatabaseUrl = assertIsolatedTestDatabase(process.env.DATABASE_URL);

const migrationFiles = [
  "../prisma/migrations/20260819181500_initial_schema/migration.sql",
  "../prisma/migrations/20260820140000_order_invariants/migration.sql",
  "../prisma/migrations/20260822110000_split_staff_roles/migration.sql",
];
const setupClient = new Client({ connectionString: testDatabaseUrl });

await setupClient.connect();
for (const migrationFile of migrationFiles) {
  const migrationSql = await readFile(new URL(migrationFile, import.meta.url), {
    encoding: "utf8",
  });
  await setupClient.query(migrationSql);
}
await setupClient.end();

const { app } = await import("../src/app.js");
const { prisma } = await import("../src/config/database.js");
const { OrderStatus, Role, TableStatus } = await import(
  "../src/generated/prisma/enums.js"
);
const { signAccessToken } = await import("../src/utils/jwt.js");

type ApiResponse<T> = {
  data?: T;
  error?: { code?: string; message?: string };
};

type OrderItem = {
  id: string;
  menuItemId: string;
  itemName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

type Order = {
  id: string;
  status: OrderStatus;
  subtotal: string;
  total: string;
  paidAt: string | null;
  items: OrderItem[];
  createdBy: { id: string; role: Role };
};

type RestaurantTable = {
  id: string;
  status: TableStatus;
  activeOrder: { id: string; status: OrderStatus; total: string } | null;
};

test("Day 3 order APIs", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}/api/V1`;
  const adminId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
  const waiterId = "cc21da0d-628c-468b-81da-fb9a0020af22";
  const cashierId = "39d01dcd-f10e-47ee-bd45-8a1958bc34f7";
  const adminToken = signAccessToken({ userId: adminId, role: Role.ADMIN });
  const waiterToken = signAccessToken({ userId: waiterId, role: Role.WAITER });
  const cashierToken = signAccessToken({
    userId: cashierId,
    role: Role.CASHIER,
  });

  const request = async <T>(
    path: string,
    options: {
      body?: Record<string, unknown>;
      method?: string;
      token?: string;
    } = {},
  ) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.token
          ? { authorization: `Bearer ${options.token}` }
          : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const responseText = await response.text();

    return {
      body: responseText
        ? (JSON.parse(responseText) as ApiResponse<T>)
        : undefined,
      status: response.status,
    };
  };

  await prisma.user.createMany({
    data: [
      {
        id: adminId,
        name: "Test Admin",
        email: "day3-admin@merhaba.test",
        passwordHash: "unused-in-token-tests",
        role: Role.ADMIN,
      },
      {
        id: waiterId,
        name: "Test Waiter",
        email: "day3-waiter@merhaba.test",
        passwordHash: "unused-in-token-tests",
        role: Role.WAITER,
      },
      {
        id: cashierId,
        name: "Test Cashier",
        email: "day3-cashier@merhaba.test",
        passwordHash: "unused-in-token-tests",
        role: Role.CASHIER,
      },
    ],
  });
  const category = await prisma.category.create({
    data: { name: "Day 3 Menu" },
  });
  const [soup, meal, unavailableItem] = await Promise.all([
    prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name: "Lentil Soup",
        price: "4.50",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name: "Grilled Chicken",
        price: "10.00",
      },
    }),
    prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name: "Unavailable Special",
        price: "12.00",
        isAvailable: false,
      },
    }),
  ]);
  const [availableTable, reservedTable, cleaningTable] = await Promise.all([
    prisma.restaurantTable.create({
      data: { tableNumber: 21, capacity: 4 },
    }),
    prisma.restaurantTable.create({
      data: { tableNumber: 22, capacity: 2, status: TableStatus.RESERVED },
    }),
    prisma.restaurantTable.create({
      data: { tableNumber: 23, capacity: 6, status: TableStatus.CLEANING },
    }),
  ]);

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await prisma.$disconnect();
  });

  let orderId = "";
  let soupOrderItemId = "";
  let mealOrderItemId = "";

  await t.test("protects order routes", async () => {
    const response = await request<{ orders: Order[] }>("/orders");
    assert.equal(response.status, 401);
  });

  await t.test("validates order creation and server-owned totals", async () => {
    const duplicateItems = await request<{ order: Order }>("/orders", {
      method: "POST",
      token: waiterToken,
      body: {
        tableId: availableTable.id,
        items: [
          { menuItemId: soup.id, quantity: 1 },
          { menuItemId: soup.id, quantity: 2 },
        ],
      },
    });
    const suppliedTotal = await request<{ order: Order }>("/orders", {
      method: "POST",
      token: waiterToken,
      body: {
        tableId: availableTable.id,
        items: [{ menuItemId: soup.id, quantity: 1 }],
        total: "0.01",
      },
    });

    assert.equal(duplicateItems.status, 400);
    assert.equal(suppliedTotal.status, 400);
  });

  await t.test("creates an order with price and name snapshots", async () => {
    const response = await request<{ order: Order }>("/orders", {
      method: "POST",
      token: waiterToken,
      body: {
        tableId: availableTable.id,
        items: [{ menuItemId: soup.id, quantity: 2 }],
      },
    });

    assert.equal(response.status, 201);
    const order = response.body?.data?.order;
    assert(order);
    orderId = order.id;
    soupOrderItemId = order.items[0]?.id ?? "";
    assert(soupOrderItemId);
    assert.equal(order.createdBy.id, waiterId);
    assert.equal(order.status, OrderStatus.PENDING);
    assert.equal(order.subtotal, "9.00");
    assert.equal(order.total, "9.00");
    assert.equal(order.items[0]?.itemName, "Lentil Soup");
    assert.equal(order.items[0]?.unitPrice, "4.50");
    assert.equal(order.items[0]?.lineTotal, "9.00");
  });

  await t.test("prevents Cashier from creating or editing orders", async () => {
    const createResponse = await request<{ order: Order }>("/orders", {
      method: "POST",
      token: cashierToken,
      body: {
        tableId: reservedTable.id,
        items: [{ menuItemId: meal.id, quantity: 1 }],
      },
    });
    const addItemResponse = await request<{ order: Order }>(
      `/orders/${orderId}/items`,
      {
        method: "POST",
        token: cashierToken,
        body: { menuItemId: meal.id, quantity: 1 },
      },
    );

    assert.equal(createResponse.status, 403);
    assert.equal(addItemResponse.status, 403);
  });

  await t.test("links the active order to its occupied table", async () => {
    const response = await request<{ table: RestaurantTable }>(
      `/tables/${availableTable.id}`,
      { token: waiterToken },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body?.data?.table.status, TableStatus.OCCUPIED);
    assert.equal(response.body?.data?.table.activeOrder?.id, orderId);
    assert.equal(response.body?.data?.table.activeOrder?.total, "9.00");
  });

  await t.test("prevents another active order or manual table release", async () => {
    const duplicateOrder = await request<{ order: Order }>("/orders", {
      method: "POST",
      token: waiterToken,
      body: {
        tableId: availableTable.id,
        items: [{ menuItemId: meal.id, quantity: 1 }],
      },
    });
    const releaseTable = await request<{ table: RestaurantTable }>(
      `/tables/${availableTable.id}/status`,
      {
        method: "PATCH",
        token: waiterToken,
        body: { status: TableStatus.AVAILABLE },
      },
    );

    assert.equal(duplicateOrder.status, 409);
    assert.equal(
      duplicateOrder.body?.error?.code,
      "TABLE_HAS_ACTIVE_ORDER",
    );
    assert.equal(releaseTable.status, 409);
    assert.equal(releaseTable.body?.error?.code, "TABLE_HAS_ACTIVE_ORDER");
  });

  await t.test("adds items and rejects duplicates or unavailable items", async () => {
    const duplicate = await request<{ order: Order }>(
      `/orders/${orderId}/items`,
      {
        method: "POST",
        token: waiterToken,
        body: { menuItemId: soup.id, quantity: 1 },
      },
    );
    const unavailable = await request<{ order: Order }>(
      `/orders/${orderId}/items`,
      {
        method: "POST",
        token: waiterToken,
        body: { menuItemId: unavailableItem.id, quantity: 1 },
      },
    );
    const added = await request<{ order: Order }>(
      `/orders/${orderId}/items`,
      {
        method: "POST",
        token: waiterToken,
        body: { menuItemId: meal.id, quantity: 1 },
      },
    );

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body?.error?.code, "ORDER_ITEM_ALREADY_EXISTS");
    assert.equal(unavailable.status, 409);
    assert.equal(unavailable.body?.error?.code, "MENU_ITEM_UNAVAILABLE");
    assert.equal(added.status, 201);
    assert.equal(added.body?.data?.order.total, "19.00");
    mealOrderItemId =
      added.body?.data?.order.items.find(
        (item) => item.menuItemId === meal.id,
      )?.id ?? "";
    assert(mealOrderItemId);
  });

  await t.test("updates quantities and recalculates totals atomically", async () => {
    const response = await request<{ order: Order }>(
      `/orders/${orderId}/items/${soupOrderItemId}`,
      {
        method: "PATCH",
        token: waiterToken,
        body: { quantity: 3 },
      },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body?.data?.order.subtotal, "23.50");
    assert.equal(response.body?.data?.order.total, "23.50");
    assert.equal(
      response.body?.data?.order.items.find(
        (item) => item.id === soupOrderItemId,
      )?.lineTotal,
      "13.50",
    );
  });

  await t.test("keeps historical snapshots after menu changes", async () => {
    await prisma.menuItem.update({
      where: { id: soup.id },
      data: { name: "Renamed Soup", price: "7.00" },
    });
    const response = await request<{ order: Order }>(`/orders/${orderId}`, {
      token: adminToken,
    });

    assert.equal(response.status, 200);
    const item = response.body?.data?.order.items.find(
      (orderItem) => orderItem.id === soupOrderItemId,
    );
    assert.equal(item?.itemName, "Lentil Soup");
    assert.equal(item?.unitPrice, "4.50");
  });

  await t.test("removes items but prevents an empty active order", async () => {
    const removed = await request<{ order: Order }>(
      `/orders/${orderId}/items/${mealOrderItemId}`,
      { method: "DELETE", token: waiterToken },
    );
    const removeLast = await request<{ order: Order }>(
      `/orders/${orderId}/items/${soupOrderItemId}`,
      { method: "DELETE", token: waiterToken },
    );

    assert.equal(removed.status, 200);
    assert.equal(removed.body?.data?.order.total, "13.50");
    assert.equal(removeLast.status, 409);
    assert.equal(removeLast.body?.error?.code, "ORDER_REQUIRES_ITEM");
  });

  await t.test("enforces forward-only status transitions", async () => {
    const invalid = await request<{ order: Order }>(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        token: waiterToken,
        body: { status: OrderStatus.READY },
      },
    );
    assert.equal(invalid.status, 409);
    assert.equal(
      invalid.body?.error?.code,
      "INVALID_ORDER_STATUS_TRANSITION",
    );

    const cashierProgressAttempt = await request<{ order: Order }>(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        token: cashierToken,
        body: { status: OrderStatus.PREPARING },
      },
    );
    assert.equal(cashierProgressAttempt.status, 403);
    assert.equal(
      cashierProgressAttempt.body?.error?.code,
      "ORDER_STATUS_FORBIDDEN",
    );

    for (const status of [
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.SERVED,
    ]) {
      const response = await request<{ order: Order }>(
        `/orders/${orderId}/status`,
        { method: "PATCH", token: waiterToken, body: { status } },
      );
      assert.equal(response.status, 200);
      assert.equal(response.body?.data?.order.status, status);
    }

    const waiterPaymentAttempt = await request<{ order: Order }>(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        token: waiterToken,
        body: { status: OrderStatus.PAID },
      },
    );
    assert.equal(waiterPaymentAttempt.status, 403);
    assert.equal(
      waiterPaymentAttempt.body?.error?.code,
      "ORDER_STATUS_FORBIDDEN",
    );

    const cashierPayment = await request<{ order: Order }>(
      `/orders/${orderId}/status`,
      {
        method: "PATCH",
        token: cashierToken,
        body: { status: OrderStatus.PAID },
      },
    );
    assert.equal(cashierPayment.status, 200);
    assert.equal(cashierPayment.body?.data?.order.status, OrderStatus.PAID);
  });

  await t.test("locks completed orders and releases the table", async () => {
    const orderResponse = await request<{ order: Order }>(`/orders/${orderId}`, {
      token: adminToken,
    });
    const itemUpdate = await request<{ order: Order }>(
      `/orders/${orderId}/items/${soupOrderItemId}`,
      {
        method: "PATCH",
        token: waiterToken,
        body: { quantity: 2 },
      },
    );
    const tableResponse = await request<{ table: RestaurantTable }>(
      `/tables/${availableTable.id}`,
      { token: waiterToken },
    );

    assert.equal(orderResponse.body?.data?.order.status, OrderStatus.PAID);
    assert(orderResponse.body?.data?.order.paidAt);
    assert.equal(itemUpdate.status, 409);
    assert.equal(itemUpdate.body?.error?.code, "ORDER_NOT_EDITABLE");
    assert.equal(
      tableResponse.body?.data?.table.status,
      TableStatus.AVAILABLE,
    );
    assert.equal(tableResponse.body?.data?.table.activeOrder, null);
  });

  await t.test("supports active, history, status, and date filters", async () => {
    const history = await request<{ orders: Order[] }>(
      "/orders?active=false&status=PAID",
      { token: adminToken },
    );
    const active = await request<{ orders: Order[] }>("/orders?active=true", {
      token: waiterToken,
    });
    const cashierActive = await request<{ orders: Order[] }>(
      "/orders?active=true",
      { token: cashierToken },
    );
    const waiterHistory = await request<{ orders: Order[] }>(
      "/orders?active=false",
      { token: waiterToken },
    );
    const cashierHistory = await request<{ orders: Order[] }>(
      "/orders?active=false",
      { token: cashierToken },
    );
    const conflicting = await request<{ orders: Order[] }>(
      "/orders?active=true&status=PAID",
      { token: waiterToken },
    );
    const date = new Date().toISOString().slice(0, 10);
    const today = await request<{ orders: Order[] }>(`/orders?date=${date}`, {
      token: adminToken,
    });
    const invalidDate = await request<{ orders: Order[] }>(
      "/orders?date=20-08-2026",
      { token: waiterToken },
    );

    assert.equal(history.status, 200);
    assert.deepEqual(
      history.body?.data?.orders.map((order) => order.id),
      [orderId],
    );
    assert.equal(active.status, 200);
    assert.deepEqual(active.body?.data?.orders, []);
    assert.equal(cashierActive.status, 200);
    assert.deepEqual(cashierActive.body?.data?.orders, []);
    assert.equal(waiterHistory.status, 403);
    assert.equal(waiterHistory.body?.error?.code, "ORDER_HISTORY_FORBIDDEN");
    assert.equal(cashierHistory.status, 403);
    assert.equal(cashierHistory.body?.error?.code, "ORDER_HISTORY_FORBIDDEN");
    assert.equal(conflicting.status, 403);
    assert.equal(conflicting.body?.error?.code, "ORDER_HISTORY_FORBIDDEN");
    assert.equal(today.status, 200);
    assert.equal(today.body?.data?.orders.length, 1);
    assert.equal(invalidDate.status, 400);

    const adminDetail = await request<{ order: Order }>(`/orders/${orderId}`, {
      token: adminToken,
    });
    const waiterDetail = await request<{ order: Order }>(`/orders/${orderId}`, {
      token: waiterToken,
    });
    const cashierDetail = await request<{ order: Order }>(
      `/orders/${orderId}`,
      { token: cashierToken },
    );

    assert.equal(adminDetail.status, 200);
    assert.equal(waiterDetail.status, 403);
    assert.equal(waiterDetail.body?.error?.code, "ORDER_HISTORY_FORBIDDEN");
    assert.equal(cashierDetail.status, 403);
    assert.equal(cashierDetail.body?.error?.code, "ORDER_HISTORY_FORBIDDEN");
  });

  await t.test("allows only Cashier or Admin to cancel orders", async () => {
    const created = await request<{ order: Order }>("/orders", {
      method: "POST",
      token: adminToken,
      body: {
        tableId: reservedTable.id,
        items: [{ menuItemId: meal.id, quantity: 1 }],
      },
    });
    assert.equal(created.status, 201);
    const waiterCancellation = await request<{ order: Order }>(
      `/orders/${created.body?.data?.order.id}/status`,
      {
        method: "PATCH",
        token: waiterToken,
        body: { status: OrderStatus.CANCELLED },
      },
    );
    const cancelled = await request<{ order: Order }>(
      `/orders/${created.body?.data?.order.id}/status`,
      {
        method: "PATCH",
        token: cashierToken,
        body: { status: OrderStatus.CANCELLED },
      },
    );
    const table = await request<{ table: RestaurantTable }>(
      `/tables/${reservedTable.id}`,
      { token: waiterToken },
    );

    assert.equal(waiterCancellation.status, 403);
    assert.equal(
      waiterCancellation.body?.error?.code,
      "ORDER_STATUS_FORBIDDEN",
    );
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body?.data?.order.status, OrderStatus.CANCELLED);
    assert.equal(table.body?.data?.table.status, TableStatus.AVAILABLE);
    assert.equal(table.body?.data?.table.activeOrder, null);
  });

  await t.test("rejects new orders for tables being cleaned", async () => {
    const response = await request<{ order: Order }>("/orders", {
      method: "POST",
      token: waiterToken,
      body: {
        tableId: cleaningTable.id,
        items: [{ menuItemId: meal.id, quantity: 1 }],
      },
    });

    assert.equal(response.status, 409);
    assert.equal(response.body?.error?.code, "TABLE_NOT_READY");
  });
});
