import { Role } from "../generated/prisma/enums.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQuery,
} from "../validators/user.validator.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword } from "../utils/password.js";
import { isPrismaError } from "../utils/prisma-error.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

const userNotFound = () =>
  new AppError(404, "USER_NOT_FOUND", "User not found");

const emailInUse = () =>
  new AppError(
    409,
    "EMAIL_IN_USE",
    "An account with this email already exists",
  );

export const listUsers = (query: UserQuery) =>
  prisma.user.findMany({
    where: query.role ? { role: query.role } : undefined,
    select: publicUserSelect,
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });

  if (!user) {
    throw userNotFound();
  }

  return user;
};

export const createUser = async (input: CreateUserInput) => {
  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: publicUserSelect,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw emailInUse();
    }

    throw error;
  }
};

export const updateUser = async (
  id: string,
  input: UpdateUserInput,
  authenticatedUserId: string,
) => {
  if (
    id === authenticatedUserId &&
    input.role !== undefined &&
    input.role !== Role.ADMIN
  ) {
    throw new AppError(
      409,
      "SELF_ROLE_CHANGE_NOT_ALLOWED",
      "Administrators cannot remove their own administrator role",
    );
  }

  const { password, ...userData } = input;
  const passwordHash = password ? await hashPassword(password) : undefined;

  try {
    return await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: publicUserSelect,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw emailInUse();
    }

    if (isPrismaError(error, "P2025")) {
      throw userNotFound();
    }

    throw error;
  }
};

export const deleteUser = async (
  id: string,
  authenticatedUserId: string,
): Promise<void> => {
  if (id === authenticatedUserId) {
    throw new AppError(
      409,
      "SELF_DELETE_NOT_ALLOWED",
      "Administrators cannot delete their own account",
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new AppError(
        409,
        "USER_HAS_ORDER_HISTORY",
        "User cannot be deleted while linked to order history",
      );
    }

    if (isPrismaError(error, "P2025")) {
      throw userNotFound();
    }

    throw error;
  }
};
