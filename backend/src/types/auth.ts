import type { Role } from "../generated/prisma/enums.js";

export type AuthenticatedUser = {
  id: string;
  role: Role;
};
