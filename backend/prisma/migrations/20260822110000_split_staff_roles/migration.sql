-- Existing operational staff become waiters. This preserves their users,
-- passwords, order history, and foreign-key relationships.
ALTER TYPE "Role" RENAME VALUE 'STAFF' TO 'WAITER';
ALTER TYPE "Role" ADD VALUE 'CASHIER';

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'WAITER';

-- Keep the original seeded account usable while giving new deployments a
-- role-specific demo email. The conditional avoids a unique-email conflict.
UPDATE "User"
SET "email" = 'waiter@merhaba.test', "name" = 'Merhaba Waiter'
WHERE "email" = 'staff@merhaba.test'
  AND NOT EXISTS (
    SELECT 1 FROM "User" WHERE "email" = 'waiter@merhaba.test'
  );
