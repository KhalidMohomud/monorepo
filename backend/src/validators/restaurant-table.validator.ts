import { z } from "zod";

import { TableStatus } from "../generated/prisma/enums.js";
import { hasAtLeastOneField } from "./common.validator.js";

const tableFields = {
  tableNumber: z.number().int().positive().max(9_999),
  capacity: z.number().int().positive().max(100),
  status: z.enum(TableStatus),
};

export const createRestaurantTableSchema = z
  .object({
    tableNumber: tableFields.tableNumber,
    capacity: tableFields.capacity,
    status: tableFields.status.optional(),
  })
  .strict();

export const updateRestaurantTableSchema = z
  .object({
    tableNumber: tableFields.tableNumber.optional(),
    capacity: tableFields.capacity.optional(),
    status: tableFields.status.optional(),
  })
  .strict()
  .refine(hasAtLeastOneField, "At least one field is required");

export const updateTableStatusSchema = z
  .object({
    status: tableFields.status,
  })
  .strict();

export const restaurantTableQuerySchema = z
  .object({
    status: tableFields.status.optional(),
  })
  .strict();

export type CreateRestaurantTableInput = z.infer<
  typeof createRestaurantTableSchema
>;
export type UpdateRestaurantTableInput = z.infer<
  typeof updateRestaurantTableSchema
>;
export type UpdateTableStatusInput = z.infer<typeof updateTableStatusSchema>;
export type RestaurantTableQuery = z.infer<
  typeof restaurantTableQuerySchema
>;

