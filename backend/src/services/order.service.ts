import { Prisma } from "../generated/prisma/client.js";
import { OrderStatus, Role, TableStatus } from "../generated/prisma/enums.js";
import type {
  AddOrderItemInput,
  CreateOrderInput,
  OrderQuery,
  UpdateOrderItemInput,
  UpdateOrderStatusInput,
} from "../validators/order.validator.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/app-error.js";
import { isPrismaError } from "../utils/prisma-error.js";

const terminalStatuses: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.CANCELLED,
];

const editableStatuses: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
];

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.SERVED, OrderStatus.CANCELLED],
  [OrderStatus.SERVED]: [OrderStatus.PAID],
  [OrderStatus.PAID]: [],
  [OrderStatus.CANCELLED]: [],
};

const waiterStatusTargets: OrderStatus[] = [
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
];

const cashierStatusTargets: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.CANCELLED,
];

const requireStatusPermission = (
  role: Role,
  targetStatus: OrderStatus,
): void => {
  if (role === Role.ADMIN) {
    return;
  }

  const allowedTargets =
    role === Role.WAITER ? waiterStatusTargets : cashierStatusTargets;

  if (!allowedTargets.includes(targetStatus)) {
    throw new AppError(
      403,
      "ORDER_STATUS_FORBIDDEN",
      "Your role cannot apply this order status",
    );
  }
};

const orderInclude = {
  table: {
    select: { id: true, tableNumber: true, capacity: true, status: true },
  },
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  items: {
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.OrderInclude;

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const orderNotFound = () =>
  new AppError(404, "ORDER_NOT_FOUND", "Order not found");

const tableNotFound = () =>
  new AppError(404, "TABLE_NOT_FOUND", "Restaurant table not found");

const menuItemUnavailable = () =>
  new AppError(
    409,
    "MENU_ITEM_UNAVAILABLE",
    "One or more menu items are unavailable",
  );

const toOrderResponse = (order: OrderRecord) => ({
  ...order,
  subtotal: order.subtotal.toFixed(2),
  total: order.total.toFixed(2),
  items: order.items.map((item) => ({
    ...item,
    unitPrice: item.unitPrice.toFixed(2),
    lineTotal: item.lineTotal.toFixed(2),
  })),
});

const requireEditableOrder = async (
  transaction: Prisma.TransactionClient,
  orderId: string,
): Promise<{ id: string; status: OrderStatus }> => {
  const order = await transaction.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) {
    throw orderNotFound();
  }

  if (!editableStatuses.includes(order.status)) {
    throw new AppError(
      409,
      "ORDER_NOT_EDITABLE",
      "Order items cannot be changed in the current status",
    );
  }

  return order;
};

const recalculateOrder = async (
  transaction: Prisma.TransactionClient,
  orderId: string,
): Promise<void> => {
  const totals = await transaction.orderItem.aggregate({
    where: { orderId },
    _sum: { lineTotal: true },
  });
  const subtotal = totals._sum.lineTotal ?? new Prisma.Decimal(0);

  await transaction.order.update({
    where: { id: orderId },
    data: { subtotal, total: subtotal },
  });
};

const findAvailableMenuItems = async (
  transaction: Prisma.TransactionClient,
  menuItemIds: string[],
) => {
  const menuItems = await transaction.menuItem.findMany({
    where: { id: { in: menuItemIds }, isAvailable: true },
    select: { id: true, name: true, price: true },
  });

  if (menuItems.length !== menuItemIds.length) {
    throw menuItemUnavailable();
  }

  return new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]));
};

export const listOrders = async (query: OrderQuery) => {
  const dayStart = query.date
    ? new Date(`${query.date}T00:00:00.000Z`)
    : undefined;
  const dayEnd = dayStart
    ? new Date(dayStart.getTime() + 24 * 60 * 60 * 1_000)
    : undefined;
  const activeStatusFilter =
    query.active === undefined
      ? undefined
      : query.active
        ? { notIn: terminalStatuses }
        : { in: terminalStatuses };
  const statusFilters: Prisma.OrderWhereInput[] = [];

  if (query.status) {
    statusFilters.push({ status: query.status });
  }

  if (activeStatusFilter) {
    statusFilters.push({ status: activeStatusFilter });
  }

  const orders = await prisma.order.findMany({
    where: {
      AND: statusFilters.length ? statusFilters : undefined,
      createdAt: dayStart ? { gte: dayStart, lt: dayEnd } : undefined,
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return orders.map(toOrderResponse);
};

export const getOrderById = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order) {
    throw orderNotFound();
  }

  return toOrderResponse(order);
};

export const createOrder = async (
  input: CreateOrderInput,
  createdById: string,
) => {
  try {
    const orderId = await prisma.$transaction(async (transaction) => {
      const table = await transaction.restaurantTable.findUnique({
        where: { id: input.tableId },
        select: { id: true, status: true },
      });

      if (!table) {
        throw tableNotFound();
      }

      const activeOrder = await transaction.order.findFirst({
        where: { tableId: table.id, status: { notIn: terminalStatuses } },
        select: { id: true },
      });

      if (activeOrder) {
        throw new AppError(
          409,
          "TABLE_HAS_ACTIVE_ORDER",
          "Restaurant table already has an active order",
        );
      }

      if (
        table.status === TableStatus.OCCUPIED ||
        table.status === TableStatus.CLEANING
      ) {
        throw new AppError(
          409,
          "TABLE_NOT_READY",
          "Restaurant table is not ready for a new order",
        );
      }

      const menuItems = await findAvailableMenuItems(
        transaction,
        input.items.map((item) => item.menuItemId),
      );
      const items = input.items.map((item) => {
        const menuItem = menuItems.get(item.menuItemId);

        if (!menuItem) {
          throw menuItemUnavailable();
        }

        return {
          menuItemId: menuItem.id,
          itemName: menuItem.name,
          unitPrice: menuItem.price,
          quantity: item.quantity,
          lineTotal: menuItem.price.mul(item.quantity),
        };
      });
      const subtotal = items.reduce(
        (sum, item) => sum.add(item.lineTotal),
        new Prisma.Decimal(0),
      );
      const createdOrder = await transaction.order.create({
        data: {
          tableId: table.id,
          createdById,
          subtotal,
          total: subtotal,
        },
      });

      await transaction.orderItem.createMany({
        data: items.map((item) => ({
          ...item,
          orderId: createdOrder.id,
        })),
      });

      await transaction.restaurantTable.update({
        where: { id: table.id },
        data: { status: TableStatus.OCCUPIED },
      });

      return createdOrder.id;
    });

    return getOrderById(orderId);
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new AppError(
        409,
        "TABLE_HAS_ACTIVE_ORDER",
        "Restaurant table already has an active order",
      );
    }

    if (isPrismaError(error, "P2003")) {
      throw new AppError(
        409,
        "ORDER_RELATION_INVALID",
        "The table, user, or menu item is no longer available",
      );
    }

    throw error;
  }
};

export const addOrderItem = async (
  orderId: string,
  input: AddOrderItemInput,
) => {
  await prisma.$transaction(async (transaction) => {
    await requireEditableOrder(transaction, orderId);

    const existingItem = await transaction.orderItem.findUnique({
      where: {
        orderId_menuItemId: { orderId, menuItemId: input.menuItemId },
      },
      select: { id: true },
    });

    if (existingItem) {
      throw new AppError(
        409,
        "ORDER_ITEM_ALREADY_EXISTS",
        "Menu item already exists on this order",
      );
    }

    const menuItems = await findAvailableMenuItems(transaction, [
      input.menuItemId,
    ]);
    const menuItem = menuItems.get(input.menuItemId);

    if (!menuItem) {
      throw menuItemUnavailable();
    }

    await transaction.orderItem.create({
      data: {
        orderId,
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        unitPrice: menuItem.price,
        quantity: input.quantity,
        lineTotal: menuItem.price.mul(input.quantity),
      },
    });
    await recalculateOrder(transaction, orderId);
  });

  return getOrderById(orderId);
};

export const updateOrderItem = async (
  orderId: string,
  itemId: string,
  input: UpdateOrderItemInput,
) => {
  await prisma.$transaction(async (transaction) => {
    await requireEditableOrder(transaction, orderId);

    const item = await transaction.orderItem.findFirst({
      where: { id: itemId, orderId },
      select: { id: true, unitPrice: true },
    });

    if (!item) {
      throw new AppError(404, "ORDER_ITEM_NOT_FOUND", "Order item not found");
    }

    await transaction.orderItem.update({
      where: { id: item.id },
      data: {
        quantity: input.quantity,
        lineTotal: item.unitPrice.mul(input.quantity),
      },
    });
    await recalculateOrder(transaction, orderId);
  });

  return getOrderById(orderId);
};

export const deleteOrderItem = async (orderId: string, itemId: string) => {
  await prisma.$transaction(async (transaction) => {
    await requireEditableOrder(transaction, orderId);
    const item = await transaction.orderItem.findFirst({
      where: { id: itemId, orderId },
      select: { id: true },
    });

    if (!item) {
      throw new AppError(404, "ORDER_ITEM_NOT_FOUND", "Order item not found");
    }

    const itemCount = await transaction.orderItem.count({ where: { orderId } });

    if (itemCount === 1) {
      throw new AppError(
        409,
        "ORDER_REQUIRES_ITEM",
        "An active order must contain at least one item",
      );
    }

    await transaction.orderItem.delete({ where: { id: item.id } });
    await recalculateOrder(transaction, orderId);
  });

  return getOrderById(orderId);
};

export const updateOrderStatus = async (
  orderId: string,
  input: UpdateOrderStatusInput,
  actorRole: Role,
) => {
  requireStatusPermission(actorRole, input.status);

  await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      select: { id: true, tableId: true, status: true },
    });

    if (!order) {
      throw orderNotFound();
    }

    if (order.status === input.status) {
      return;
    }

    if (!allowedTransitions[order.status].includes(input.status)) {
      throw new AppError(
        409,
        "INVALID_ORDER_STATUS_TRANSITION",
        `Order cannot move from ${order.status} to ${input.status}`,
      );
    }

    const isTerminal = terminalStatuses.includes(input.status);
    await transaction.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        paidAt: input.status === OrderStatus.PAID ? new Date() : null,
      },
    });

    if (isTerminal) {
      await transaction.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: TableStatus.AVAILABLE },
      });
    }
  });

  return getOrderById(orderId);
};
