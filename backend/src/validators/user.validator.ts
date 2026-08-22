import { z } from "zod";

import { Role } from "../generated/prisma/enums.js";
import {
  emailSchema,
  passwordSchema,
  userNameSchema,
} from "./auth.validator.js";
import { hasAtLeastOneField } from "./common.validator.js";

export const userQuerySchema = z
  .object({
    role: z.enum(Role).optional(),
  })
  .strict();

export const createUserSchema = z
  .object({
    name: userNameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(Role).default(Role.WAITER),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: userNameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: z.enum(Role).optional(),
  })
  .strict()
  .refine(hasAtLeastOneField, "At least one field is required");

export type UserQuery = z.infer<typeof userQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
