import { z } from "zod";

import {
  hasAtLeastOneField,
  optionalDescriptionSchema,
} from "./common.validator.js";

const categoryFields = {
  name: z.string().trim().min(1, "Category name is required").max(100),
  description: optionalDescriptionSchema.optional(),
};

export const createCategorySchema = z.object(categoryFields).strict();

export const updateCategorySchema = z
  .object({
    name: categoryFields.name.optional(),
    description: categoryFields.description,
  })
  .strict()
  .refine(hasAtLeastOneField, "At least one field is required");

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

