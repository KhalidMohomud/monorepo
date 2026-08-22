import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { Client } from "pg";

import { assertIsolatedTestDatabase } from "./test-database-safety.js";

process.env.NODE_ENV = "test";
const TEST_JWT_SECRET = "test-only-secret-that-is-at-least-32-characters";
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.FRONTEND_URL = "http://localhost:3000";

const testDatabaseUrl = assertIsolatedTestDatabase(process.env.DATABASE_URL);

const migrationSql = await readFile(
  new URL(
    "../prisma/migrations/20260819181500_initial_schema/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const setupClient = new Client({ connectionString: testDatabaseUrl });

await setupClient.connect();
await setupClient.query(migrationSql);
await setupClient.end();

const { app } = await import("../src/app.js");
const { prisma } = await import("../src/config/database.js");
const { authenticate } = await import("../src/middleware/auth.middleware.js");
const { authorize } = await import("../src/middleware/role.middleware.js");
const { errorHandler } = await import(
  "../src/middleware/error.middleware.js"
);
const { Role } = await import("../src/generated/prisma/enums.js");
const { signAccessToken } = await import("../src/utils/jwt.js");

type JsonResponse = {
  data?: {
    accessToken?: string;
    user?: Record<string, unknown>;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

const parseJsonResponse = async (response: Response) => ({
  body: (await response.json()) as JsonResponse,
  status: response.status,
});

test("authentication API", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert(address && typeof address !== "string");

  const apiBaseUrl = `http://127.0.0.1:${address.port}/api`;
  const baseUrl = `${apiBaseUrl}/V1/auth`;

  const rbacApp = express();
  rbacApp.get(
    "/admin",
    authenticate,
    authorize(Role.ADMIN),
    (_req, res) => {
      res.status(204).send();
    },
  );
  rbacApp.get(
    "/operations",
    authenticate,
    authorize(Role.ADMIN, Role.STAFF),
    (_req, res) => {
      res.status(204).send();
    },
  );
  rbacApp.get("/error", () => {
    throw new Error("SENSITIVE_STACK_MARKER");
  });
  rbacApp.use(errorHandler);

  const rbacServer = rbacApp.listen(0, "127.0.0.1");
  await once(rbacServer, "listening");

  const rbacAddress = rbacServer.address();
  assert(rbacAddress && typeof rbacAddress !== "string");
  const rbacBaseUrl = `http://127.0.0.1:${rbacAddress.port}`;

  const request = async (
    endpoint: "/register" | "/login",
    body: Record<string, unknown>,
  ) => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    return parseJsonResponse(response);
  };

  const requestMe = async (authorization?: string) => {
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: authorization ? { authorization } : undefined,
    });

    return parseJsonResponse(response);
  };

  const requestRbacRoute = (route: "/admin" | "/operations", token: string) =>
    fetch(`${rbacBaseUrl}${route}`, {
      headers: { authorization: `Bearer ${token}` },
    });

  t.after(async () => {
    const closeServer = (serverToClose: typeof server) =>
      new Promise<void>((resolve, reject) => {
        serverToClose.close((error) =>
          error ? reject(error) : resolve(),
        );
      });

    await Promise.all([closeServer(server), closeServer(rbacServer)]);
    await prisma.$disconnect();
  });

  const email = "khalid@example.com";
  const password = "StrongPassword123";
  let staffUserId = "";
  let staffAccessToken = "";

  await t.test("applies Helmet and fixes CORS to FRONTEND_URL", async () => {
    const allowedResponse = await fetch(`${apiBaseUrl}/health`, {
      headers: { origin: process.env.FRONTEND_URL },
    });
    const disallowedResponse = await fetch(`${apiBaseUrl}/health`, {
      headers: { origin: "https://untrusted.example" },
    });

    assert.equal(
      allowedResponse.headers.get("x-content-type-options"),
      "nosniff",
    );
    assert.equal(
      allowedResponse.headers.get("access-control-allow-origin"),
      process.env.FRONTEND_URL,
    );
    assert.equal(
      disallowedResponse.headers.get("access-control-allow-origin"),
      process.env.FRONTEND_URL,
    );
    assert.notEqual(
      disallowedResponse.headers.get("access-control-allow-origin"),
      "https://untrusted.example",
    );
    assert.notEqual(
      disallowedResponse.headers.get("access-control-allow-origin"),
      "*",
    );
  });

  await t.test("does not expose unhandled error details", async () => {
    const response = await fetch(`${rbacBaseUrl}/error`);
    const result = await parseJsonResponse(response);

    assert.equal(result.status, 500);
    assert.equal(result.body.error?.code, "INTERNAL_SERVER_ERROR");
    assert.equal(
      JSON.stringify(result.body).includes("SENSITIVE_STACK_MARKER"),
      false,
    );
  });

  await t.test("rejects malformed JSON as a client error", async () => {
    const response = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const result = await parseJsonResponse(response);

    assert.equal(result.status, 400);
    assert.equal(result.body.error?.code, "INVALID_JSON");
  });

  await t.test("rejects JSON bodies larger than 100kb", async () => {
    const response = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x".repeat(110_000) }),
    });
    const result = await parseJsonResponse(response);

    assert.equal(result.status, 413);
    assert.equal(result.body.error?.code, "PAYLOAD_TOO_LARGE");
  });

  await t.test("registers a staff user", async () => {
    const response = await request("/register", {
      name: "Khalid",
      email,
      password,
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.data?.user?.email, email);
    assert.equal(response.body.data?.user?.role, "STAFF");
    assert.equal("passwordHash" in (response.body.data?.user ?? {}), false);
    const registeredUserId = response.body.data?.user?.id;
    assert.equal(typeof registeredUserId, "string");
    assert(typeof registeredUserId === "string");
    staffUserId = registeredUserId;
  });

  await t.test("rejects duplicate registration", async () => {
    const response = await request("/register", {
      name: "Another Khalid",
      email: email.toUpperCase(),
      password,
    });

    assert.equal(response.status, 409);
    assert.equal(response.body.error?.code, "EMAIL_IN_USE");
  });

  await t.test("rejects an invalid email", async () => {
    const response = await request("/register", {
      name: "Khalid",
      email: "not-an-email",
      password,
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error?.code, "VALIDATION_ERROR");
  });

  await t.test("rejects a short password", async () => {
    const response = await request("/register", {
      name: "Khalid",
      email: "short-password@example.com",
      password: "short",
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error?.code, "VALIDATION_ERROR");
  });

  await t.test("rejects public role assignment", async () => {
    const response = await request("/register", {
      name: "Attacker",
      email: "attacker@example.com",
      password,
      role: "ADMIN",
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error?.code, "VALIDATION_ERROR");
  });

  await t.test("logs in with valid credentials", async () => {
    const response = await request("/login", {
      email: email.toUpperCase(),
      password,
    });

    assert.equal(response.status, 200);
    assert.equal(typeof response.body.data?.accessToken, "string");
    assert.equal(response.body.data?.user?.email, email);
    assert.equal("passwordHash" in (response.body.data?.user ?? {}), false);
    staffAccessToken = response.body.data?.accessToken ?? "";
  });

  let invalidCredentialsResponse: JsonResponse["error"];

  await t.test("rejects an incorrect password", async () => {
    const response = await request("/login", {
      email,
      password: "IncorrectPassword123",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.error?.code, "INVALID_CREDENTIALS");
    invalidCredentialsResponse = response.body.error;
  });

  await t.test("rejects a nonexistent account generically", async () => {
    const response = await request("/login", {
      email: "missing@example.com",
      password,
    });

    assert.equal(response.status, 401);
    assert.deepEqual(response.body.error, invalidCredentialsResponse);
  });

  await t.test("rejects /me without a token", async () => {
    const response = await requestMe();

    assert.equal(response.status, 401);
    assert.equal(response.body.error?.code, "AUTHENTICATION_REQUIRED");
  });

  await t.test("rejects a malformed authorization header", async () => {
    const response = await requestMe(`Token ${staffAccessToken}`);

    assert.equal(response.status, 401);
    assert.equal(response.body.error?.code, "AUTHENTICATION_REQUIRED");
  });

  await t.test("rejects an invalid token", async () => {
    const response = await requestMe("Bearer not-a-valid-jwt");

    assert.equal(response.status, 401);
    assert.equal(response.body.error?.code, "AUTHENTICATION_REQUIRED");
  });

  await t.test("rejects an expired token", async () => {
    const expiredToken = jwt.sign({ role: Role.STAFF }, TEST_JWT_SECRET, {
      algorithm: "HS256",
      audience: "merhaba-order-desk-api",
      expiresIn: -1,
      issuer: "merhaba-order-desk",
      subject: staffUserId,
    });
    const response = await requestMe(`Bearer ${expiredToken}`);

    assert.equal(response.status, 401);
    assert.equal(response.body.error?.code, "AUTHENTICATION_REQUIRED");
  });

  await t.test("returns the current user for a valid token", async () => {
    const response = await requestMe(`Bearer ${staffAccessToken}`);

    assert.equal(response.status, 200);
    assert.deepEqual(
      Object.keys(response.body.data?.user ?? {}).sort(),
      ["email", "id", "name", "role"],
    );
    assert.equal(response.body.data?.user?.id, staffUserId);
    assert.equal(response.body.data?.user?.email, email);
  });

  await t.test("forbids STAFF from an ADMIN-only route", async () => {
    const response = await requestRbacRoute("/admin", staffAccessToken);
    const body = (await response.json()) as JsonResponse;

    assert.equal(response.status, 403);
    assert.equal(body.error?.code, "INSUFFICIENT_PERMISSIONS");
  });

  await t.test("allows ADMIN through an ADMIN-only route", async () => {
    const adminToken = signAccessToken({
      userId: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
      role: Role.ADMIN,
    });
    const response = await requestRbacRoute("/admin", adminToken);

    assert.equal(response.status, 204);
  });

  await t.test("allows STAFF through a shared role route", async () => {
    const response = await requestRbacRoute("/operations", staffAccessToken);

    assert.equal(response.status, 204);
  });
});
