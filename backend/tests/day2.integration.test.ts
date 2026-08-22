import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";

import { assertIsolatedTestDatabase } from "./test-database-safety.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.CLOUDINARY_NAME = "";
process.env.CLOUDINARY_API_KEY = "";
process.env.CLOUDINARY_API_SECRET = "";

const testDatabaseUrl = assertIsolatedTestDatabase(process.env.DATABASE_URL);

const migrationFiles = [
  "../prisma/migrations/20260819181500_initial_schema/migration.sql",
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
const { Role } = await import("../src/generated/prisma/enums.js");
const { signAccessToken } = await import("../src/utils/jwt.js");

type ApiError = {
  code?: string;
  message?: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: ApiError;
};

type Category = {
  id: string;
  name: string;
  description: string | null;
  menuItemCount: number;
};

type MenuItem = {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
  category: { id: string; name: string };
};

type RestaurantTable = {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
};

test("Day 2 domain APIs", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}/api/V1`;

  const adminToken = signAccessToken({
    userId: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
    role: Role.ADMIN,
  });
  const waiterToken = signAccessToken({
    userId: "cc21da0d-628c-468b-81da-fb9a0020af22",
    role: Role.WAITER,
  });
  const cashierToken = signAccessToken({
    userId: "39d01dcd-f10e-47ee-bd45-8a1958bc34f7",
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

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await prisma.$disconnect();
  });

  let categoryId = "";
  let availableMenuItemId = "";
  let unavailableMenuItemId = "";
  let tableId = "";

  await t.test("protects category routes", async () => {
    const unauthenticated = await request<{ categories: Category[] }>(
      "/categories",
    );
    const waiter = await request<{ categories: Category[] }>("/categories", {
      token: waiterToken,
    });

    assert.equal(unauthenticated.status, 401);
    assert.equal(waiter.status, 403);
  });

  await t.test("creates and updates a category as Admin", async () => {
    const created = await request<{ category: Category }>("/categories", {
      method: "POST",
      token: adminToken,
      body: { name: "Drinks", description: "Cold beverages" },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body?.data?.category.name, "Drinks");
    categoryId = created.body?.data?.category.id ?? "";
    assert(categoryId);

    const updated = await request<{ category: Category }>(
      `/categories/${categoryId}`,
      {
        method: "PATCH",
        token: adminToken,
        body: { description: "Hot and cold beverages" },
      },
    );

    assert.equal(updated.status, 200);
    assert.equal(
      updated.body?.data?.category.description,
      "Hot and cold beverages",
    );
  });

  await t.test("rejects duplicate and malformed categories", async () => {
    const duplicate = await request<{ category: Category }>("/categories", {
      method: "POST",
      token: adminToken,
      body: { name: "Drinks" },
    });
    const malformed = await request<{ category: Category }>("/categories", {
      method: "POST",
      token: adminToken,
      body: { name: "" },
    });

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body?.error?.code, "CATEGORY_NAME_IN_USE");
    assert.equal(malformed.status, 400);
  });

  await t.test("restricts menu mutations to Admin", async () => {
    const response = await request<{ menuItem: MenuItem }>("/menu-items", {
      method: "POST",
      token: waiterToken,
      body: {
        categoryId,
        name: "Forbidden",
        price: "1.00",
      },
    });

    assert.equal(response.status, 403);
  });

  await t.test("protects and validates menu image uploads", async () => {
    const waiterForm = new FormData();
    const waiterResponse = await fetch(`${baseUrl}/menu-items/images`, {
      method: "POST",
      headers: { authorization: `Bearer ${waiterToken}` },
      body: waiterForm,
    });

    const emptyAdminForm = new FormData();
    const emptyAdminResponse = await fetch(`${baseUrl}/menu-items/images`, {
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: emptyAdminForm,
    });
    const emptyAdminBody = (await emptyAdminResponse.json()) as ApiResponse<{
      imageUrl: string;
    }>;

    const invalidImageForm = new FormData();
    invalidImageForm.append(
      "image",
      new Blob(["not an image"], { type: "text/plain" }),
      "menu.txt",
    );
    const invalidImageResponse = await fetch(
      `${baseUrl}/menu-items/images`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${adminToken}` },
        body: invalidImageForm,
      },
    );

    const imageForm = new FormData();
    imageForm.append(
      "image",
      new Blob(["image bytes"], { type: "image/png" }),
      "menu.png",
    );
    const unconfiguredResponse = await fetch(
      `${baseUrl}/menu-items/images`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${adminToken}` },
        body: imageForm,
      },
    );
    const unconfiguredBody =
      (await unconfiguredResponse.json()) as ApiResponse<{
        imageUrl: string;
      }>;

    assert.equal(waiterResponse.status, 403);
    assert.equal(emptyAdminResponse.status, 400);
    assert.equal(emptyAdminBody.error?.code, "IMAGE_REQUIRED");
    assert.equal(invalidImageResponse.status, 415);
    assert.equal(unconfiguredResponse.status, 503);
    assert.equal(
      unconfiguredBody.error?.code,
      "IMAGE_UPLOAD_NOT_CONFIGURED",
    );
  });

  await t.test("creates available and unavailable menu items", async () => {
    const available = await request<{ menuItem: MenuItem }>("/menu-items", {
      method: "POST",
      token: adminToken,
      body: {
        categoryId,
        name: "Fresh Lime",
        description: "Freshly squeezed",
        price: "4.5",
      },
    });
    const unavailable = await request<{ menuItem: MenuItem }>("/menu-items", {
      method: "POST",
      token: adminToken,
      body: {
        categoryId,
        name: "Seasonal Juice",
        price: 6,
        isAvailable: false,
      },
    });

    assert.equal(available.status, 201);
    assert.equal(available.body?.data?.menuItem.price, "4.50");
    assert.equal(unavailable.status, 201);
    availableMenuItemId = available.body?.data?.menuItem.id ?? "";
    unavailableMenuItemId = unavailable.body?.data?.menuItem.id ?? "";
    assert(availableMenuItemId && unavailableMenuItemId);
  });

  await t.test("shows operational roles only available menu items", async () => {
    const waiterResponse = await request<{ menuItems: MenuItem[] }>(
      "/menu-items",
      { token: waiterToken },
    );
    const cashierResponse = await request<{ menuItems: MenuItem[] }>(
      "/menu-items",
      { token: cashierToken },
    );
    const adminResponse = await request<{ menuItems: MenuItem[] }>(
      "/menu-items?isAvailable=false",
      { token: adminToken },
    );

    assert.equal(waiterResponse.status, 200);
    assert.deepEqual(
      waiterResponse.body?.data?.menuItems.map((item) => item.id),
      [availableMenuItemId],
    );
    assert.equal(cashierResponse.status, 200);
    assert.deepEqual(
      cashierResponse.body?.data?.menuItems.map((item) => item.id),
      [availableMenuItemId],
    );
    assert.deepEqual(
      adminResponse.body?.data?.menuItems.map((item) => item.id),
      [unavailableMenuItemId],
    );
  });

  await t.test("validates menu prices and category IDs", async () => {
    const invalidPrice = await request<{ menuItem: MenuItem }>("/menu-items", {
      method: "POST",
      token: adminToken,
      body: { categoryId, name: "Invalid", price: "-1.00" },
    });
    const missingCategory = await request<{ menuItem: MenuItem }>(
      "/menu-items",
      {
        method: "POST",
        token: adminToken,
        body: {
          categoryId: "ab637e06-3ace-4860-9135-ab85ecabe91e",
          name: "Orphan",
          price: "1.00",
        },
      },
    );

    assert.equal(invalidPrice.status, 400);
    assert.equal(missingCategory.status, 404);
    assert.equal(missingCategory.body?.error?.code, "CATEGORY_NOT_FOUND");
  });

  await t.test("prevents deleting a category that contains items", async () => {
    const response = await request(`/categories/${categoryId}`, {
      method: "DELETE",
      token: adminToken,
    });

    assert.equal(response.status, 409);
    assert.equal(response.body?.error?.code, "CATEGORY_IN_USE");
  });

  await t.test("allows Waiter to create and manage tables", async () => {
    const created = await request<{ table: RestaurantTable }>("/tables", {
      method: "POST",
      token: waiterToken,
      body: { tableNumber: 1, capacity: 4 },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body?.data?.table.status, "AVAILABLE");
    tableId = created.body?.data?.table.id ?? "";
    assert(tableId);

    const updated = await request<{ table: RestaurantTable }>(
      `/tables/${tableId}/status`,
      {
        method: "PATCH",
        token: waiterToken,
        body: { status: "OCCUPIED" },
      },
    );

    assert.equal(updated.status, 200);
    assert.equal(updated.body?.data?.table.status, "OCCUPIED");
  });

  await t.test("validates and enforces unique tables", async () => {
    const duplicate = await request<{ table: RestaurantTable }>("/tables", {
      method: "POST",
      token: adminToken,
      body: { tableNumber: 1, capacity: 2 },
    });
    const invalid = await request<{ table: RestaurantTable }>("/tables", {
      method: "POST",
      token: waiterToken,
      body: { tableNumber: 2, capacity: 0 },
    });

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body?.error?.code, "TABLE_NUMBER_IN_USE");
    assert.equal(invalid.status, 400);
  });

  await t.test("allows Cashier to view but not manage tables", async () => {
    const listResponse = await request<{ tables: RestaurantTable[] }>(
      "/tables",
      { token: cashierToken },
    );
    const createResponse = await request<{ table: RestaurantTable }>(
      "/tables",
      {
        method: "POST",
        token: cashierToken,
        body: { tableNumber: 3, capacity: 2 },
      },
    );
    const statusResponse = await request<{ table: RestaurantTable }>(
      `/tables/${tableId}/status`,
      {
        method: "PATCH",
        token: cashierToken,
        body: { status: "AVAILABLE" },
      },
    );

    assert.equal(listResponse.status, 200);
    assert.equal(createResponse.status, 403);
    assert.equal(statusResponse.status, 403);
  });

  await t.test("filters tables by status", async () => {
    const response = await request<{ tables: RestaurantTable[] }>(
      "/tables?status=OCCUPIED",
      { token: waiterToken },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body?.data?.tables.map((table) => table.id),
      [tableId],
    );
  });

  await t.test("cleans up domain records", async () => {
    for (const menuItemId of [availableMenuItemId, unavailableMenuItemId]) {
      const response = await request(`/menu-items/${menuItemId}`, {
        method: "DELETE",
        token: adminToken,
      });
      assert.equal(response.status, 204);
    }

    const categoryResponse = await request(`/categories/${categoryId}`, {
      method: "DELETE",
      token: adminToken,
    });
    const tableResponse = await request(`/tables/${tableId}`, {
      method: "DELETE",
      token: waiterToken,
    });

    assert.equal(categoryResponse.status, 204);
    assert.equal(tableResponse.status, 204);
  });
});
