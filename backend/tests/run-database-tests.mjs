import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const testFiles = process.argv.slice(2);

if (testFiles.length === 0) {
  throw new Error("At least one integration test file is required");
}

const port = 55_432;
const serverScript = fileURLToPath(
  new URL(
    "../node_modules/@electric-sql/pglite-socket/dist/scripts/server.js",
    import.meta.url,
  ),
);

const runTestFile = async (testFile) => {
  const databaseServer = spawn(process.execPath, [
    serverScript,
    "--db=memory://",
    `--port=${port}`,
    "--max-connections=10",
  ]);

  databaseServer.stdout.pipe(process.stdout);
  databaseServer.stderr.pipe(process.stderr);

  const databaseExit = new Promise((resolve) => {
    databaseServer.once("exit", resolve);
  });

  const databaseReady = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Timed out while starting the test database")),
      15_000,
    );

    const inspectOutput = (chunk) => {
      if (chunk.toString().includes("PGLiteSocketServer listening")) {
        clearTimeout(timeout);
        databaseServer.stdout.off("data", inspectOutput);
        resolve();
      }
    };

    databaseServer.stdout.on("data", inspectOutput);
    databaseServer.once("error", reject);
    databaseServer.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Test database exited before startup with code ${code}`));
    });
  });

  const stopDatabase = async () => {
    if (databaseServer.exitCode !== null) {
      return;
    }

    databaseServer.kill("SIGTERM");

    const forceShutdown = setTimeout(() => {
      databaseServer.kill("SIGKILL");
    }, 5_000);

    await databaseExit;
    clearTimeout(forceShutdown);
  };

  try {
    await databaseReady;

    const testProcess = spawn(
      fileURLToPath(
        new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url),
      ),
      ["--test", "--test-concurrency=1", testFile],
      {
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
        },
        stdio: "inherit",
      },
    );

    const testExitCode = await new Promise((resolve, reject) => {
      testProcess.once("error", reject);
      testProcess.once("exit", (code) => resolve(code ?? 1));
    });

    if (testExitCode !== 0) {
      throw new Error(`${testFile} failed with exit code ${testExitCode}`);
    }
  } finally {
    await stopDatabase();
  }
};

for (const testFile of testFiles) {
  await runTestFile(testFile);
}

