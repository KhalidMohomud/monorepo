import { app } from "./app.js";
import { prisma } from "./config/database.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully.`);

  server.close(async (error) => {
    let exitCode = 0;

    if (error) {
      console.error("Failed to close the HTTP server", { name: error.name });
      exitCode = 1;
    }

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Failed to disconnect from the database", {
        name:
          disconnectError instanceof Error
            ? disconnectError.name
            : "UnknownError",
      });
      exitCode = 1;
    }

    process.exit(exitCode);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
