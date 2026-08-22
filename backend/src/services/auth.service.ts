import { Prisma } from "../generated/prisma/client.js";
import { Role } from "../generated/prisma/enums.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validators/auth.validator.js";
import { AppError } from "../utils/app-error.js";
import { signAccessToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { toPublicUser } from "../utils/user.js";
import { prisma } from "../config/database.js";

const EMAIL_IN_USE = new AppError(
  409,
  "EMAIL_IN_USE",
  "An account with this email already exists",
);

const INVALID_CREDENTIALS = new AppError(
  401,
  "INVALID_CREDENTIALS",
  "Invalid email or password",
);

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw EMAIL_IN_USE;
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: Role.WAITER,
      },
    });

    return toPublicUser(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw EMAIL_IN_USE;
    }

    throw error;
  }
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw INVALID_CREDENTIALS;
  }

  const passwordMatches = await comparePassword(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw INVALID_CREDENTIALS;
  }

  return {
    accessToken: signAccessToken({ userId: user.id, role: user.role }),
    user: toPublicUser(user),
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Authentication required",
    );
  }

  return user;
};
