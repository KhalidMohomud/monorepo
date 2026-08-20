import { z } from "zod";

export const idParamSchema = z
  .object({
    id: z.uuid("A valid resource ID is required"),
  })
  .strict();

export const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .transform((value) => (value === "" ? null : value));

export const hasAtLeastOneField = (value: object): boolean =>
  Object.keys(value).length > 0;

