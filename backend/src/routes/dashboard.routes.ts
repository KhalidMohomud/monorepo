import { Router } from "express";

import { overview } from "../controllers/dashboard.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.use(
  authenticate,
  authorize(Role.ADMIN, Role.WAITER, Role.CASHIER),
);
dashboardRouter.get("/overview", overview);
