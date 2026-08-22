import { Router } from "express";

import {
  create,
  getById,
  list,
  remove,
  update,
  updateStatus,
} from "../controllers/restaurant-table.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

export const restaurantTableRouter = Router();

restaurantTableRouter.use(authenticate);

restaurantTableRouter.get(
  "/",
  authorize(Role.ADMIN, Role.WAITER, Role.CASHIER),
  list,
);
restaurantTableRouter.get(
  "/:id",
  authorize(Role.ADMIN, Role.WAITER, Role.CASHIER),
  getById,
);
restaurantTableRouter.post("/", authorize(Role.ADMIN, Role.WAITER), create);
restaurantTableRouter.patch(
  "/:id",
  authorize(Role.ADMIN, Role.WAITER),
  update,
);
restaurantTableRouter.patch(
  "/:id/status",
  authorize(Role.ADMIN, Role.WAITER),
  updateStatus,
);
restaurantTableRouter.delete(
  "/:id",
  authorize(Role.ADMIN, Role.WAITER),
  remove,
);
