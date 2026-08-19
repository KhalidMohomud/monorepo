import jwt from "jsonwebtoken";
import { z } from "zod";

import { env } from "../config/env.js";
import { Role } from "../generated/prisma/enums.js";

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "merhaba-order-desk";
const JWT_AUDIENCE = "merhaba-order-desk-api";

const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  role: z.enum(Role),
  iat: z.number().int(),
  exp: z.number().int(),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

type AccessTokenInput = {
  userId: string;
  role: Role;
};

export const signAccessToken = ({
  userId,
  role,
}: AccessTokenInput): string =>
  jwt.sign({ role }, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    audience: JWT_AUDIENCE,
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
    issuer: JWT_ISSUER,
    subject: userId,
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
  });

  return accessTokenPayloadSchema.parse(payload);
};
