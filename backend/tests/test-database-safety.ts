const isolatedDatabaseHostnames = new Set(["127.0.0.1", "localhost"]);
const isolatedDatabasePort = "55432";

export const assertIsolatedTestDatabase = (
  databaseUrl: string | undefined,
  isolationMarker = process.env.TEST_DATABASE_ISOLATED,
): string => {
  if (process.env.NODE_ENV !== "test" || isolationMarker !== "true") {
    throw new Error(
      "Refusing to run database tests outside the isolated test runner",
    );
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for integration tests");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("Test DATABASE_URL is invalid");
  }

  if (
    !isolatedDatabaseHostnames.has(parsedUrl.hostname) ||
    parsedUrl.port !== isolatedDatabasePort
  ) {
    throw new Error(
      "Refusing to run database tests against a non-isolated database",
    );
  }

  return databaseUrl;
};
