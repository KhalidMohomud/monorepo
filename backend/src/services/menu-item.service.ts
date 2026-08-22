import { Prisma } from "../generated/prisma/client.js";
import { Role } from "../generated/prisma/enums.js";
import type {
  CreateMenuItemInput,
  MenuItemQuery,
  UpdateMenuItemInput,
} from "../validators/menu-item.validator.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/app-error.js";
import { isPrismaError } from "../utils/prisma-error.js";

const menuItemInclude = {
  category: {
    select: { id: true, name: true },
  },
} satisfies Prisma.MenuItemInclude;

type MenuItemRecord = Prisma.MenuItemGetPayload<{
  include: typeof menuItemInclude;
}>;

const menuItemNotFound = () =>
  new AppError(404, "MENU_ITEM_NOT_FOUND", "Menu item not found");

const categoryNotFound = () =>
  new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");

const menuItemNameInUse = () =>
  new AppError(
    409,
    "MENU_ITEM_NAME_IN_USE",
    "A menu item with this name already exists in the category",
  );

const toMenuItemResponse = (menuItem: MenuItemRecord) => ({
  ...menuItem,
  price: menuItem.price.toFixed(2),
});

const ensureCategoryExists = async (categoryId: string): Promise<void> => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw categoryNotFound();
  }
};

export const listMenuItems = async (query: MenuItemQuery, role: Role) => {
  const menuItems = await prisma.menuItem.findMany({
    where: {
      categoryId: query.categoryId,
      isAvailable: role === Role.ADMIN ? query.isAvailable : true,
    },
    include: menuItemInclude,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return menuItems.map(toMenuItemResponse);
};

export const getMenuItemById = async (id: string, role: Role) => {
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id,
      isAvailable: role === Role.ADMIN ? undefined : true,
    },
    include: menuItemInclude,
  });

  if (!menuItem) {
    throw menuItemNotFound();
  }

  return toMenuItemResponse(menuItem);
};

export const createMenuItem = async (input: CreateMenuItemInput) => {
  await ensureCategoryExists(input.categoryId);

  try {
    const menuItem = await prisma.menuItem.create({
      data: input,
      include: menuItemInclude,
    });

    return toMenuItemResponse(menuItem);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw menuItemNameInUse();
    }

    if (isPrismaError(error, "P2003")) {
      throw categoryNotFound();
    }

    throw error;
  }
};

export const updateMenuItem = async (
  id: string,
  input: UpdateMenuItemInput,
) => {
  if (input.categoryId) {
    await ensureCategoryExists(input.categoryId);
  }

  try {
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: input,
      include: menuItemInclude,
    });

    return toMenuItemResponse(menuItem);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw menuItemNameInUse();
    }

    if (isPrismaError(error, "P2003")) {
      throw categoryNotFound();
    }

    if (isPrismaError(error, "P2025")) {
      throw menuItemNotFound();
    }

    throw error;
  }
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    await prisma.menuItem.delete({ where: { id } });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new AppError(
        409,
        "MENU_ITEM_IN_USE",
        "Menu item cannot be deleted because it is part of an order history",
      );
    }

    if (isPrismaError(error, "P2025")) {
      throw menuItemNotFound();
    }

    throw error;
  }
};
