import { compare, hash } from "bcryptjs";

const PASSWORD_SALT_ROUNDS = 12;

export const hashPassword = (plainPassword: string): Promise<string> =>
  hash(plainPassword, PASSWORD_SALT_ROUNDS);

export const comparePassword = (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => compare(plainPassword, passwordHash);
