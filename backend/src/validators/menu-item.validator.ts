import { z } from "zod";

import {
  hasAtLeastOneField,
  optionalDescriptionSchema,
} from "./common.validator.js";

const priceSchema = z
  .union([z.string(), z.number()])
  .transform(String)
  .pipe(
    z
      .string()
      .regex(
        /^\d{1,10}(?:\.\d{1,2})?$/,
        "Price must be a non-negative amount with at most 2 decimal places",
      )
      .refine(
        (value) => Number(value) <= 9_999_999_999.99,
        "Price exceeds the supported maximum",
      ),
  );

const imageUrlSchema = z
  .union([z.url("Image URL must be valid").max(2_048), z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));

const menuItemFields = {
  categoryId: z.uuid("A valid category ID is required"),
  name: z.string().trim().min(1, "Menu item name is required").max(120),
  description: optionalDescriptionSchema.optional(),
  price: priceSchema,
  imageUrl: imageUrlSchema.optional(),
  isAvailable: z.boolean().optional(),
};

export const createMenuItemSchema = z.object(menuItemFields).strict();

export const updateMenuItemSchema = z
  .object({
    categoryId: menuItemFields.categoryId.optional(),
    name: menuItemFields.name.optional(),
    description: menuItemFields.description,
    price: menuItemFields.price.optional(),
    imageUrl: menuItemFields.imageUrl,
    isAvailable: menuItemFields.isAvailable,
  })
  .strict()
  .refine(hasAtLeastOneField, "At least one field is required");

export const menuItemQuerySchema = z
  .object({
    categoryId: z.uuid("A valid category ID is required").optional(),
    isAvailable: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  })
  .strict();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type MenuItemQuery = z.infer<typeof menuItemQuerySchema>;

