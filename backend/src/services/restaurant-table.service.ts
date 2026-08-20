import { Prisma } from "../generated/prisma/client.js";
import { OrderStatus, TableStatus } from "../generated/prisma/enums.js";
import type {
  CreateRestaurantTableInput,
  RestaurantTableQuery,
  UpdateRestaurantTableInput,
  UpdateTableStatusInput,
} from "../validators/restaurant-table.validator.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/app-error.js";
import { isPrismaError } from "../utils/prisma-error.js";

const terminalOrderStatuses: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.CANCELLED,
];

const tableInclude = {
  orders: {
    where: { status: { notIn: terminalOrderStatuses } },
    select: { id: true, status: true, total: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 1,
  },
} satisfies Prisma.RestaurantTableInclude;

type RestaurantTableRecord = Prisma.RestaurantTableGetPayload<{
  include: typeof tableInclude;
}>;

const toRestaurantTableResponse = (table: RestaurantTableRecord) => {
  const { orders, ...tableData } = table;
  const activeOrder = orders[0];

  return {
    ...tableData,
    activeOrder: activeOrder
      ? { ...activeOrder, total: activeOrder.total.toFixed(2) }
      : null,
  };
};

const tableNotFound = () =>
  new AppError(404, "TABLE_NOT_FOUND", "Restaurant table not found");

const tableNumberInUse = () =>
  new AppError(
    409,
    "TABLE_NUMBER_IN_USE",
    "A restaurant table with this number already exists",
  );

export const listRestaurantTables = async (query: RestaurantTableQuery) => {
  const tables = await prisma.restaurantTable.findMany({
    where: { status: query.status },
    include: tableInclude,
    orderBy: { tableNumber: "asc" },
  });

  return tables.map(toRestaurantTableResponse);
};

export const getRestaurantTableById = async (id: string) => {
  const table = await prisma.restaurantTable.findUnique({
    where: { id },
    include: tableInclude,
  });

  if (!table) {
    throw tableNotFound();
  }

  return toRestaurantTableResponse(table);
};

export const createRestaurantTable = async (
  input: CreateRestaurantTableInput,
) => {
  try {
    const table = await prisma.restaurantTable.create({
      data: input,
      include: tableInclude,
    });

    return toRestaurantTableResponse(table);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw tableNumberInUse();
    }

    throw error;
  }
};

export const updateRestaurantTable = async (
  id: string,
  input: UpdateRestaurantTableInput,
) => {
  try {
    await prisma.$transaction(async (transaction) => {
      if (input.status && input.status !== TableStatus.OCCUPIED) {
        const activeOrder = await transaction.order.findFirst({
          where: { tableId: id, status: { notIn: terminalOrderStatuses } },
          select: { id: true },
        });

        if (activeOrder) {
          throw new AppError(
            409,
            "TABLE_HAS_ACTIVE_ORDER",
            "Table status cannot be changed while it has an active order",
          );
        }
      }

      await transaction.restaurantTable.update({
        where: { id },
        data: input,
      });
    });

    return getRestaurantTableById(id);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw tableNumberInUse();
    }

    if (isPrismaError(error, "P2025")) {
      throw tableNotFound();
    }

    throw error;
  }
};

export const updateRestaurantTableStatus = (
  id: string,
  input: UpdateTableStatusInput,
) => updateRestaurantTable(id, input);

export const deleteRestaurantTable = async (id: string): Promise<void> => {
  try {
    await prisma.restaurantTable.delete({ where: { id } });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new AppError(
        409,
        "TABLE_IN_USE",
        "Restaurant table cannot be deleted because it has order history",
      );
    }

    if (isPrismaError(error, "P2025")) {
      throw tableNotFound();
    }

    throw error;
  }
};
