import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { emitKeypressEvents } from "node:readline";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { Role, TableStatus } from "../src/generated/prisma/enums.js";
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

const categorySeedData = [
  { name: "Starters", description: "Small plates and appetizers" },
  { name: "Main Course", description: "Restaurant main dishes" },
  { name: "Drinks", description: "Hot and cold beverages" },
  { name: "Desserts", description: "Sweet finishes" },
] as const;

const menuItemSeedData = [
  {
    categoryName: "Starters",
    name: "Lentil Soup",
    description: "Red lentils with mild spices",
    price: "4.50",
  },
  {
    categoryName: "Starters",
    name: "Hummus",
    description: "Chickpeas, tahini, and olive oil",
    price: "5.00",
  },
  {
    categoryName: "Main Course",
    name: "Grilled Chicken",
    description: "Grilled chicken with seasonal vegetables",
    price: "12.50",
  },
  {
    categoryName: "Main Course",
    name: "Beef Burger",
    description: "Beef patty, salad, and house sauce",
    price: "10.75",
  },
  {
    categoryName: "Drinks",
    name: "Turkish Tea",
    description: "Freshly brewed black tea",
    price: "2.00",
  },
  {
    categoryName: "Drinks",
    name: "Fresh Lime",
    description: "Fresh lime juice served chilled",
    price: "4.50",
  },
  {
    categoryName: "Desserts",
    name: "Baklava",
    description: "Layered pastry with pistachios",
    price: "5.50",
  },
] as const;

const tableSeedData = [
  { tableNumber: 1, capacity: 2 },
  { tableNumber: 2, capacity: 2 },
  { tableNumber: 3, capacity: 4 },
  { tableNumber: 4, capacity: 4 },
  { tableNumber: 5, capacity: 6 },
  { tableNumber: 6, capacity: 8 },
] as const;

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

  const result = await prisma.$transaction(async (transaction) => {
    const categories = await Promise.all(
      categorySeedData.map((category) =>
        transaction.category.upsert({
          where: { name: category.name },
          update: { description: category.description },
          create: category,
          select: { id: true, name: true },
        }),
      ),
    );
    const categoryIds = new Map(
      categories.map((category) => [category.name, category.id]),
    );

    const users = await Promise.all([
      transaction.user.upsert({
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
      transaction.user.upsert({
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

    const menuItems = await Promise.all(
      menuItemSeedData.map((menuItem) => {
        const categoryId = categoryIds.get(menuItem.categoryName);

        if (!categoryId) {
          throw new Error(`Seed category not found: ${menuItem.categoryName}`);
        }

        const data = {
          categoryId,
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price,
          isAvailable: true,
        };

        return transaction.menuItem.upsert({
          where: {
            categoryId_name: { categoryId, name: menuItem.name },
          },
          update: data,
          create: data,
          select: { id: true },
        });
      }),
    );

    const tables = await Promise.all(
      tableSeedData.map((table) =>
        transaction.restaurantTable.upsert({
          where: { tableNumber: table.tableNumber },
          update: { capacity: table.capacity },
          create: { ...table, status: TableStatus.AVAILABLE },
          select: { id: true },
        }),
      ),
    );

    return {
      users,
      categories: categories.length,
      menuItems: menuItems.length,
      tables: tables.length,
    };
  });

  console.info("Database seed completed", result);
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
