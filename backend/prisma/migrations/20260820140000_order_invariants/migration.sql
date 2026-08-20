-- Each menu item has one line per order. Quantity changes update that line.
CREATE UNIQUE INDEX "OrderItem_orderId_menuItemId_key"
ON "OrderItem"("orderId", "menuItemId");

DROP INDEX "OrderItem_orderId_idx";

-- A table can be linked to only one non-terminal order at a time.
CREATE UNIQUE INDEX "Order_one_active_per_table_key"
ON "Order"("tableId")
WHERE "status" NOT IN ('PAID', 'CANCELLED');
