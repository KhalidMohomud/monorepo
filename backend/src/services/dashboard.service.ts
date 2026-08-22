import { Prisma } from "../generated/prisma/client.js";
import { OrderStatus, TableStatus } from "../generated/prisma/enums.js";
import { prisma } from "../config/database.js";

const activeOrderStatuses = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
] as const;

const getUtcDayRange = (date: Date) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
};

export const getDashboardOverview = async () => {
  const { start, end } = getUtcDayRange(new Date());
  const activeStatusGroupsQuery = prisma.order.groupBy({
    by: ["status"],
    where: { status: { in: [...activeOrderStatuses] } },
    orderBy: { status: "asc" },
    _count: true,
  });
  const [
    occupiedTables,
    totalTables,
    activeStatusGroups,
    todayOrders,
    todayRevenueResult,
    recentOrderRecords,
  ] = await prisma.$transaction([
    prisma.restaurantTable.count({
      where: { status: TableStatus.OCCUPIED },
    }),
    prisma.restaurantTable.count(),
    activeStatusGroupsQuery,
    prisma.order.count({
      where: { createdAt: { gte: start, lt: end } },
    }),
    prisma.order.aggregate({
      where: {
        status: OrderStatus.PAID,
        paidAt: { gte: start, lt: end },
      },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        table: { select: { id: true, tableNumber: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const activeOrdersByStatus: Record<
    (typeof activeOrderStatuses)[number],
    number
  > = {
    [OrderStatus.PENDING]: 0,
    [OrderStatus.PREPARING]: 0,
    [OrderStatus.READY]: 0,
    [OrderStatus.SERVED]: 0,
  };

  for (const group of activeStatusGroups) {
    if (group.status in activeOrdersByStatus) {
      activeOrdersByStatus[
        group.status as keyof typeof activeOrdersByStatus
      ] = group._count;
    }
  }

  const activeOrders = Object.values(activeOrdersByStatus).reduce(
    (total, count) => total + count,
    0,
  );
  const todayRevenue =
    todayRevenueResult._sum.total ?? new Prisma.Decimal(0);

  return {
    summary: {
      occupiedTables,
      totalTables,
      activeOrders,
      todayOrders,
      todayRevenue: todayRevenue.toFixed(2),
    },
    activeOrdersByStatus,
    recentOrders: recentOrderRecords.map(({ _count, ...order }) => ({
      ...order,
      total: order.total.toFixed(2),
      itemCount: _count.items,
    })),
  };
};
