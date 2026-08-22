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
const { Role } = await import("../src/generated/prisma/enums.js");
const { signAccessToken } = await import("../src/utils/jwt.js");
const { comparePassword, hashPassword } = await import(
  "../src/utils/password.js"
);

type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "WAITER" | "CASHIER";
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  data?: {
    accessToken?: string;
    user?: UserResponse;
    users?: UserResponse[];
  };
  error?: {
    code?: string;
    message?: string;
  };
};

test("Admin user management API", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert(address && typeof address !== "string");

  const apiBaseUrl = `http://127.0.0.1:${address.port}/api/V1`;
  const adminId = "71908444-42ef-4dea-8d0f-e5691180e8f3";
  const waiterId = "99211405-6005-424a-ae26-15102b6e2c96";
  const cashierId = "39d01dcd-f10e-47ee-bd45-8a1958bc34f7";
  const initialPassword = "StrongPassword123";
  const passwordHash = await hashPassword(initialPassword);

  await prisma.user.createMany({
    data: [
      {
        id: adminId,
        name: "User Admin",
        email: "user-admin@merhaba.test",
        passwordHash,
        role: Role.ADMIN,
      },
      {
        id: waiterId,
        name: "User Waiter",
        email: "user-waiter@merhaba.test",
        passwordHash,
        role: Role.WAITER,
      },
      {
        id: cashierId,
        name: "User Cashier",
        email: "user-cashier@merhaba.test",
        passwordHash,
        role: Role.CASHIER,
      },
    ],
  });

  const adminToken = signAccessToken({ userId: adminId, role: Role.ADMIN });
  const waiterToken = signAccessToken({ userId: waiterId, role: Role.WAITER });
  const cashierToken = signAccessToken({
    userId: cashierId,
    role: Role.CASHIER,
  });

  const request = async (
    path: string,
    options: {
      body?: Record<string, unknown>;
      method?: "GET" | "POST" | "PATCH" | "DELETE";
      token?: string;
    } = {},
  ) => {
    const response = await fetch(`${apiBaseUrl}/users${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.token
          ? { authorization: `Bearer ${options.token}` }
          : {}),
        ...(options.body ? { "content-type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const responseText = await response.text();

    return {
      body: responseText
        ? (JSON.parse(responseText) as ApiResponse)
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

  await t.test("requires authentication", async () => {
    const response = await request("");

    assert.equal(response.status, 401);
    assert.equal(response.body?.error?.code, "AUTHENTICATION_REQUIRED");
  });

  await t.test("rejects Waiter and Cashier users", async () => {
    const waiterResponse = await request("", { token: waiterToken });
    const cashierResponse = await request("", { token: cashierToken });

    assert.equal(waiterResponse.status, 403);
    assert.equal(
      waiterResponse.body?.error?.code,
      "INSUFFICIENT_PERMISSIONS",
    );
    assert.equal(cashierResponse.status, 403);
    assert.equal(
      cashierResponse.body?.error?.code,
      "INSUFFICIENT_PERMISSIONS",
    );
  });

  await t.test("lists safe users and supports role filtering", async () => {
    const allResponse = await request("", { token: adminToken });
    const waiterResponse = await request("?role=WAITER", {
      token: adminToken,
    });
    const cashierResponse = await request("?role=CASHIER", {
      token: adminToken,
    });

    assert.equal(allResponse.status, 200);
    assert.equal(allResponse.body?.data?.users?.length, 3);
    assert.equal(
      JSON.stringify(allResponse.body).includes("passwordHash"),
      false,
    );
    assert.equal(waiterResponse.status, 200);
    assert.deepEqual(
      waiterResponse.body?.data?.users?.map((user) => user.role),
      [Role.WAITER],
    );
    assert.equal(cashierResponse.status, 200);
    assert.deepEqual(
      cashierResponse.body?.data?.users?.map((user) => user.role),
      [Role.CASHIER],
    );
  });

  let managedUserId = "";

  await t.test("creates a Waiter user by default with a hashed password", async () => {
    const response = await request("", {
      method: "POST",
      token: adminToken,
      body: {
        name: "Managed User",
        email: "MANAGED@MERHABA.TEST",
        password: initialPassword,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body?.data?.user?.email, "managed@merhaba.test");
    assert.equal(response.body?.data?.user?.role, Role.WAITER);
    assert.equal(
      JSON.stringify(response.body).includes("passwordHash"),
      false,
    );

    const createdId = response.body?.data?.user?.id;
    assert(createdId);
    managedUserId = createdId;

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { id: managedUserId },
      select: { passwordHash: true },
    });
    assert.notEqual(storedUser.passwordHash, initialPassword);
    assert.equal(
      await comparePassword(initialPassword, storedUser.passwordHash),
      true,
    );
  });

  await t.test("allows an Admin to create a Cashier", async () => {
    const response = await request("", {
      method: "POST",
      token: adminToken,
      body: {
        name: "Checkout Cashier",
        email: "cashier-managed@merhaba.test",
        password: initialPassword,
        role: Role.CASHIER,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body?.data?.user?.role, Role.CASHIER);
    assert.equal(
      JSON.stringify(response.body).includes("passwordHash"),
      false,
    );
  });

  await t.test("allows an Admin to explicitly create another Admin", async () => {
    const response = await request("", {
      method: "POST",
      token: adminToken,
      body: {
        name: "Second Admin",
        email: "second-admin@merhaba.test",
        password: initialPassword,
        role: Role.ADMIN,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body?.data?.user?.role, Role.ADMIN);
  });

  await t.test("rejects duplicate email and malformed input", async () => {
    const duplicateResponse = await request("", {
      method: "POST",
      token: adminToken,
      body: {
        name: "Duplicate User",
        email: "managed@merhaba.test",
        password: initialPassword,
      },
    });
    const invalidResponse = await request("", {
      method: "POST",
      token: adminToken,
      body: {
        name: "X",
        email: "invalid",
        password: "short",
      },
    });

    assert.equal(duplicateResponse.status, 409);
    assert.equal(duplicateResponse.body?.error?.code, "EMAIL_IN_USE");
    assert.equal(invalidResponse.status, 400);
    assert.equal(invalidResponse.body?.error?.code, "VALIDATION_ERROR");
  });

  await t.test("gets and updates a user without exposing the hash", async () => {
    const getResponse = await request(`/${managedUserId}`, {
      token: adminToken,
    });
    const updateResponse = await request(`/${managedUserId}`, {
      method: "PATCH",
      token: adminToken,
      body: {
        name: "Managed Administrator",
        email: "UPDATED@MERHABA.TEST",
        role: Role.ADMIN,
      },
    });

    assert.equal(getResponse.status, 200);
    assert.equal(getResponse.body?.data?.user?.id, managedUserId);
    assert.equal(updateResponse.status, 200);
    assert.equal(
      updateResponse.body?.data?.user?.email,
      "updated@merhaba.test",
    );
    assert.equal(updateResponse.body?.data?.user?.role, Role.ADMIN);
    assert.equal(
      JSON.stringify(updateResponse.body).includes("passwordHash"),
      false,
    );
  });

  await t.test("updates passwords through the production hash utility", async () => {
    const newPassword = "UpdatedPassword456";
    const updateResponse = await request(`/${managedUserId}`, {
      method: "PATCH",
      token: adminToken,
      body: { password: newPassword },
    });

    assert.equal(updateResponse.status, 200);

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { id: managedUserId },
      select: { passwordHash: true },
    });
    assert.equal(await comparePassword(newPassword, storedUser.passwordHash), true);
    assert.equal(
      await comparePassword(initialPassword, storedUser.passwordHash),
      false,
    );

    const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "updated@merhaba.test",
        password: newPassword,
      }),
    });
    const loginBody = (await loginResponse.json()) as ApiResponse;

    assert.equal(loginResponse.status, 200);
    assert.equal(typeof loginBody.data?.accessToken, "string");
    assert.equal(loginBody.data?.user?.role, Role.ADMIN);
  });

  await t.test("prevents an Admin from demoting itself", async () => {
    const response = await request(`/${adminId}`, {
      method: "PATCH",
      token: adminToken,
      body: { role: Role.WAITER },
    });

    assert.equal(response.status, 409);
    assert.equal(
      response.body?.error?.code,
      "SELF_ROLE_CHANGE_NOT_ALLOWED",
    );
  });

  await t.test("prevents an Admin from deleting itself", async () => {
    const response = await request(`/${adminId}`, {
      method: "DELETE",
      token: adminToken,
    });

    assert.equal(response.status, 409);
    assert.equal(response.body?.error?.code, "SELF_DELETE_NOT_ALLOWED");
  });

  await t.test("prevents deletion when a user has order history", async () => {
    const restaurantTable = await prisma.restaurantTable.create({
      data: { tableNumber: 91, capacity: 4 },
    });
    await prisma.order.create({
      data: {
        tableId: restaurantTable.id,
        createdById: waiterId,
        subtotal: "0.00",
        total: "0.00",
      },
    });

    const response = await request(`/${waiterId}`, {
      method: "DELETE",
      token: adminToken,
    });

    assert.equal(response.status, 409);
    assert.equal(response.body?.error?.code, "USER_HAS_ORDER_HISTORY");
  });

  await t.test("deletes users without order history", async () => {
    const response = await request(`/${managedUserId}`, {
      method: "DELETE",
      token: adminToken,
    });

    assert.equal(response.status, 204);
    assert.equal(
      await prisma.user.findUnique({ where: { id: managedUserId } }),
      null,
    );
  });

  await t.test("returns 404 for an unknown user", async () => {
    const response = await request(
      "/6e59cfee-8894-423c-86c1-7603352b01ed",
      { token: adminToken },
    );

    assert.equal(response.status, 404);
    assert.equal(response.body?.error?.code, "USER_NOT_FOUND");
  });
});
