import { z } from "zod";

import { OrderStatus } from "../generated/prisma/enums.js";

const orderLineSchema = z
  .object({
    menuItemId: z.uuid("A valid menu item ID is required"),
    quantity: z.number().int().positive().max(100),
  })
  .strict();

export const createOrderSchema = z
  .object({
    tableId: z.uuid("A valid table ID is required"),
    items: z.array(orderLineSchema).min(1).max(50),
  })
  .strict()
  .superRefine((value, context) => {
    const menuItemIds = new Set<string>();

    value.items.forEach((item, index) => {
      if (menuItemIds.has(item.menuItemId)) {
        context.addIssue({
          code: "custom",
          message: "A menu item may appear only once in an order",
          path: ["items", index, "menuItemId"],
        });
      }

      menuItemIds.add(item.menuItemId);
    });
  });

export const addOrderItemSchema = orderLineSchema;

export const updateOrderItemSchema = z
  .object({
    quantity: z.number().int().positive().max(100),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(OrderStatus),
  })
  .strict();

export const orderQuerySchema = z
  .object({
    status: z.enum(OrderStatus).optional(),
    active: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    date: z.iso.date().optional(),
  })
  .strict();

export const orderItemParamSchema = z
  .object({
    id: z.uuid("A valid order ID is required"),
    itemId: z.uuid("A valid order item ID is required"),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>;
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
