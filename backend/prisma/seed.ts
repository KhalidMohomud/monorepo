import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { emitKeypressEvents } from "node:readline";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { Role } from "../src/generated/prisma/enums.js";
import { hashPassword } from "../src/utils/password.js";

const bcryptPasswordLimit = (password: string): boolean =>
  Buffer.byteLength(password, "utf8") <= 72;

const seedEnvironmentSchema = z.object({
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
});

const seedPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72)
  .refine(bcryptPasswordLimit, "Password must not exceed 72 bytes");

const parsedEnvironment = seedEnvironmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error(
    "Invalid seed configuration",
    parsedEnvironment.error.flatten().fieldErrors,
  );
  process.exit(1);
}

const seedEnvironment = parsedEnvironment.data;
const adapter = new PrismaPg({
  connectionString: seedEnvironment.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

type Keypress = {
  ctrl?: boolean;
  meta?: boolean;
  name?: string;
};

const readHiddenInput = (prompt: string): Promise<string> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("A password environment variable is required outside a terminal");
  }

  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    const previousRawMode = input.isRaw ?? false;
    let value = "";

    const cleanup = (): void => {
      input.off("keypress", onKeypress);
      input.setRawMode(previousRawMode);
      input.pause();
    };

    const onKeypress = (character: string | undefined, key: Keypress): void => {
      if (key.ctrl && (key.name === "c" || key.name === "d")) {
        cleanup();
        output.write("\n");
        reject(new Error("Database seed cancelled"));
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        cleanup();
        output.write("\n");
        resolve(value);
        return;
      }

      if (key.name === "backspace") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          output.write("\b \b");
        }
        return;
      }

      if (character && !key.ctrl && !key.meta) {
        value += character;
        output.write("*".repeat(Array.from(character).length));
      }
    };

    output.write(prompt);
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKeypress);
  });
};

const resolveSeedPassword = async (
  environmentName: "SEED_ADMIN_PASSWORD" | "SEED_STAFF_PASSWORD",
  accountLabel: string,
): Promise<string> => {
  const configuredPassword = process.env[environmentName];

  if (configuredPassword) {
    return seedPasswordSchema.parse(configuredPassword);
  }

  while (true) {
    const password = await readHiddenInput(`${accountLabel} demo password: `);
    const validation = seedPasswordSchema.safeParse(password);

    if (!validation.success) {
      console.error(validation.error.issues[0]?.message ?? "Invalid password");
      continue;
    }

    const confirmation = await readHiddenInput("Confirm password: ");

    if (password !== confirmation) {
      console.error("Passwords do not match");
      continue;
    }

    return password;
  }
};

const seed = async (): Promise<void> => {
  const adminPassword = await resolveSeedPassword(
    "SEED_ADMIN_PASSWORD",
    "Admin",
  );
  const staffPassword = await resolveSeedPassword(
    "SEED_STAFF_PASSWORD",
    "Staff",
  );

  const [adminPasswordHash, staffPasswordHash] = await Promise.all([
    hashPassword(adminPassword),
    hashPassword(staffPassword),
  ]);

  const users = await prisma.$transaction([
    prisma.user.upsert({
      where: { email: "admin@merhaba.test" },
      update: {
        name: "Merhaba Admin",
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
      },
      create: {
        name: "Merhaba Admin",
        email: "admin@merhaba.test",
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
      },
      select: { email: true, role: true },
    }),
    prisma.user.upsert({
      where: { email: "staff@merhaba.test" },
      update: {
        name: "Merhaba Staff",
        passwordHash: staffPasswordHash,
        role: Role.STAFF,
      },
      create: {
        name: "Merhaba Staff",
        email: "staff@merhaba.test",
        passwordHash: staffPasswordHash,
        role: Role.STAFF,
      },
      select: { email: true, role: true },
    }),
  ]);

  console.info("Database seed completed", { users });
};

try {
  await seed();
} catch (error) {
  console.error("Database seed failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
