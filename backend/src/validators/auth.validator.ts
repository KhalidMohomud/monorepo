import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("A valid email address is required").max(254));

const bcryptPasswordLimit = (password: string): boolean =>
  Buffer.byteLength(password, "utf8") <= 72;

export const userNameSchema = z.string().trim().min(2).max(100);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72)
  .refine(bcryptPasswordLimit, "Password must not exceed 72 bytes");

export const registerSchema = z
  .object({
    name: userNameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1, "Password is required")
      .max(72)
      .refine(bcryptPasswordLimit, "Password must not exceed 72 bytes"),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
