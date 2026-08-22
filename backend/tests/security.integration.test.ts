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

type ApiResponse = {
  data?: {
    accessToken?: string;
    user?: Record<string, unknown>;
  };
  error?: {
    code?: string;
    details?: Array<{ field?: string; message?: string }>;
    message?: string;
  };
};

const parseJson = async (response: Response) =>
  (await response.json()) as ApiResponse;

test("security controls", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert(address && typeof address !== "string");
  const apiBaseUrl = `http://127.0.0.1:${address.port}/api`;
  const authBaseUrl = `${apiBaseUrl}/V1/auth`;

  const postAuth = (endpoint: "/register" | "/login", body: unknown) =>
    fetch(`${authBaseUrl}${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await prisma.$disconnect();
  });

  await t.test("refuses non-isolated test database targets", () => {
    assert.throws(
      () =>
        assertIsolatedTestDatabase(
          "postgresql://user:password@production.example/merhaba",
          "true",
        ),
      /Refusing to run database tests against a non-isolated database/,
    );
  });

  await t.test("does not allow SQL injection to bypass login", async () => {
    const email = "security-user@example.com";
    const password = "StrongPassword123";
    const registration = await postAuth("/register", {
      name: "Security User",
      email,
      password,
    });
    assert.equal(registration.status, 201);

    const passwordInjection = await postAuth("/login", {
      email,
      password: "' OR '1'='1",
    });
    const passwordInjectionBody = await parseJson(passwordInjection);
    assert.equal(passwordInjection.status, 401);
    assert.equal(passwordInjectionBody.error?.code, "INVALID_CREDENTIALS");
    assert.equal(passwordInjectionBody.data?.accessToken, undefined);

    const emailInjection = await postAuth("/login", {
      email: "security-user@example.com' OR '1'='1",
      password,
    });
    const emailInjectionBody = await parseJson(emailInjection);
    assert.equal(emailInjection.status, 400);
    assert.equal(emailInjectionBody.error?.code, "VALIDATION_ERROR");

    assert.equal(await prisma.user.count({ where: { email } }), 1);
  });

  await t.test("strictly validates request bodies", async () => {
    const response = await postAuth("/register", {
      name: "Privilege Attempt",
      email: "privilege-attempt@example.com",
      password: "StrongPassword123",
      role: "ADMIN",
      unexpected: true,
    });
    const body = await parseJson(response);

    assert.equal(response.status, 400);
    assert.equal(body.error?.code, "VALIDATION_ERROR");
    assert.equal(Array.isArray(body.error?.details), true);
    assert.equal(
      await prisma.user.count({
        where: { email: "privilege-attempt@example.com" },
      }),
      0,
    );
  });

  await t.test("blocks browser CSRF through bearer auth and fixed CORS", async () => {
    const attackerOrigin = "https://attacker.example";
    const preflight = await fetch(`${apiBaseUrl}/V1/users`, {
      method: "OPTIONS",
      headers: {
        origin: attackerOrigin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization,content-type",
      },
    });

    assert.equal(preflight.status, 204);
    assert.notEqual(
      preflight.headers.get("access-control-allow-origin"),
      attackerOrigin,
    );
    assert.notEqual(preflight.headers.get("access-control-allow-origin"), "*");
    assert.equal(
      preflight.headers.get("access-control-allow-credentials"),
      null,
    );

    const unauthenticatedMutation = await fetch(`${apiBaseUrl}/V1/users`, {
      method: "POST",
      headers: {
        origin: attackerOrigin,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const unauthenticatedBody = await parseJson(unauthenticatedMutation);
    assert.equal(unauthenticatedMutation.status, 401);
    assert.equal(
      unauthenticatedBody.error?.code,
      "AUTHENTICATION_REQUIRED",
    );
  });

  await t.test("returns untrusted text as JSON with anti-XSS headers", async () => {
    const xssName = "<script>alert('xss')</script>";
    const response = await postAuth("/register", {
      name: xssName,
      email: "xss-test@example.com",
      password: "StrongPassword123",
    });
    const body = await parseJson(response);

    assert.equal(response.status, 201);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(
      response.headers.get("content-security-policy") ?? "",
      /script-src 'self'/,
    );
    assert.equal(body.data?.user?.name, xssName);
    assert.equal("passwordHash" in (body.data?.user ?? {}), false);
  });
});
