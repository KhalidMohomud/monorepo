import "dotenv/config";

import { z } from "zod";

const optionalCredentialSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().max(65_535).default(4000),
    FRONTEND_URL: z.url().default("http://localhost:3000"),
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine(
        (value) => {
          try {
            const protocol = new URL(value).protocol;
            return protocol === "postgresql:" || protocol === "postgres:";
          } catch {
            return false;
          }
        },
        { message: "DATABASE_URL must be a valid PostgreSQL connection URL" },
      ),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86_400)
      .default(900),
    CLOUDINARY_NAME: optionalCredentialSchema,
    CLOUDINARY_API_KEY: optionalCredentialSchema,
    CLOUDINARY_API_SECRET: optionalCredentialSchema,
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment configuration",
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment configuration");
}

export const env = parsedEnv.data;
