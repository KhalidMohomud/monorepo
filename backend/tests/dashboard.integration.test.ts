import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";

import type {
  MenuItem,
  Order,
  RestaurantTable,
} from "../src/generated/prisma/client.js";
import { assertIsolatedTestDatabase } from "./test-database-safety.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";
process.env.FRONTEND_URL = "http://localhost:3000";

const testDatabaseUrl = assertIsolatedTestDatabase(process.env.DATABASE_URL);

const migrationFiles = [
  "../prisma/migrations/20260819181500_initial_schema/migration.sql",
  "../prisma/migrations/20260820140000_order_invariants/migration.sql",
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

type DashboardOverview = {
  summary: {
    occupiedTables: number;
    totalTables: number;
    activeOrders: number;
    todayOrders: number;
    todayRevenue: string;
  };
  activeOrdersByStatus: Record<string, number>;
  recentOrders: Array<{
    id: string;
    itemCount: number;
    status: OrderStatus;
    total: string;
    table: { id: string; tableNumber: number };
  }>;
};

type ApiResponse<T> = {
  data?: T;
  error?: { code?: string; message?: string };
};

test("dashboard overview API", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}/api/V1`;
  const adminId = "e355f12c-75ec-428b-94f1-28ea445a8e8b";
  const staffId = "facf4b0b-c9f0-4c50-ae60-8507426c33ec";
  const adminToken = signAccessToken({ userId: adminId, role: Role.ADMIN });
  const staffToken = signAccessToken({ userId: staffId, role: Role.STAFF });

  const requestOverview = async (token?: string) => {
    const response = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
    const responseText = await response.text();

    return {
      body: responseText
        ? (JSON.parse(responseText) as ApiResponse<{
            dashboard: DashboardOverview;
          }>)
        : undefined,
      status: response.status,
    };
  };

  await prisma.user.createMany({
    data: [
      {
        id: adminId,
        name: "Dashboard Admin",
        email: "dashboard-admin@merhaba.test",
        passwordHash: "unused-in-token-tests",
        role: Role.ADMIN,
      },
      {
        id: staffId,
        name: "Dashboard Staff",
        email: "dashboard-staff@merhaba.test",
        passwordHash: "unused-in-token-tests",
        role: Role.STAFF,
      },
    ],
  });
  const category = await prisma.category.create({
    data: { name: "Dashboard Menu" },
  });
  const menuItems: MenuItem[] = [];

  for (const [index, price] of ["10.00", "12.50", "15.00"].entries()) {
    menuItems.push(
      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: `Dashboard Item ${index + 1}`,
          price,
        },
      }),
    );
  }

  const tableStatuses = [
    TableStatus.OCCUPIED,
    TableStatus.OCCUPIED,
    TableStatus.OCCUPIED,
    TableStatus.OCCUPIED,
    TableStatus.OCCUPIED,
    TableStatus.AVAILABLE,
    TableStatus.AVAILABLE,
  ];
  const tables: RestaurantTable[] = [];

  for (const [index, status] of tableStatuses.entries()) {
    tables.push(
      await prisma.restaurantTable.create({
        data: { tableNumber: index + 31, capacity: 4, status },
      }),
    );
  }

  const now = new Date();
  const todayMidday = new Date(now);
  todayMidday.setUTCHours(12, 0, 0, 0);
  const yesterdayMidday = new Date(todayMidday);
  yesterdayMidday.setUTCDate(yesterdayMidday.getUTCDate() - 1);

  const createOrderRecord = async (input: {
    createdAt: Date;
    itemCount: number;
    paidAt?: Date;
    status: OrderStatus;
    tableIndex: number;
    total: string;
  }) => {
    const order = await prisma.order.create({
      data: {
        tableId: tables[input.tableIndex]!.id,
        createdById: staffId,
        status: input.status,
        subtotal: input.total,
        total: input.total,
        createdAt: input.createdAt,
        paidAt: input.paidAt,
      },
    });

    await prisma.orderItem.createMany({
      data: menuItems.slice(0, input.itemCount).map((menuItem) => ({
        orderId: order.id,
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        unitPrice: menuItem.price,
        quantity: 1,
        lineTotal: menuItem.price,
      })),
    });

    return order;
  };

  const activeInputs = [
    { status: OrderStatus.PENDING, total: "10.00", itemCount: 1 },
    { status: OrderStatus.PENDING, total: "20.00", itemCount: 2 },
    { status: OrderStatus.PREPARING, total: "30.00", itemCount: 3 },
    { status: OrderStatus.READY, total: "40.00", itemCount: 1 },
    { status: OrderStatus.SERVED, total: "50.00", itemCount: 2 },
  ];
  const activeOrders: Order[] = [];

  for (const [index, input] of activeInputs.entries()) {
    activeOrders.push(
      await createOrderRecord({
        ...input,
        tableIndex: index,
        createdAt: new Date(todayMidday.getTime() + (5 - index) * 60_000),
      }),
    );
  }

  await createOrderRecord({
    tableIndex: 5,
    status: OrderStatus.PAID,
    total: "45.50",
    itemCount: 2,
    createdAt: todayMidday,
    paidAt: todayMidday,
  });
  await createOrderRecord({
    tableIndex: 6,
    status: OrderStatus.PAID,
    total: "100.00",
    itemCount: 1,
    createdAt: yesterdayMidday,
    paidAt: yesterdayMidday,
  });

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await prisma.$disconnect();
  });

  await t.test("requires authentication", async () => {
    const response = await requestOverview();
    assert.equal(response.status, 401);
  });

  await t.test("returns operational metrics to Staff", async () => {
    const response = await requestOverview(staffToken);
    const dashboard = response.body?.data?.dashboard;

    assert.equal(response.status, 200);
    assert(dashboard);
    assert.deepEqual(dashboard.summary, {
      occupiedTables: 5,
      totalTables: 7,
      activeOrders: 5,
      todayOrders: 6,
      todayRevenue: "45.50",
    });
    assert.deepEqual(dashboard.activeOrdersByStatus, {
      PENDING: 2,
      PREPARING: 1,
      READY: 1,
      SERVED: 1,
    });
  });

  await t.test("returns five sorted and safe recent orders", async () => {
    const response = await requestOverview(adminToken);
    const recentOrders = response.body?.data?.dashboard.recentOrders;

    assert.equal(response.status, 200);
    assert(recentOrders);
    assert.equal(recentOrders.length, 5);
    assert.deepEqual(
      recentOrders.map((order) => order.id),
      activeOrders.map((order) => order.id),
    );
    assert.deepEqual(
      recentOrders.map((order) => order.itemCount),
      [1, 2, 3, 1, 2],
    );
    assert.equal(recentOrders[0]?.total, "10.00");
    assert.equal(recentOrders[0]?.table.tableNumber, 31);
    assert.equal(JSON.stringify(response.body).includes("passwordHash"), false);
  });
});
