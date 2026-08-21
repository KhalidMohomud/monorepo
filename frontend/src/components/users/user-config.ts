import type { Role } from "@/lib/types";

export type UserFilter = Role | "ALL";

export type UserFormState = {
  email: string;
  name: string;
  password: string;
  role: Role;
};

export const EMPTY_USER_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
};
