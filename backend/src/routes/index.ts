import { Router } from "express";

import { authProfileRouter } from "./auth-profile.routes.js";
import { authRouter } from "./auth.routes.js";
import { categoryRouter } from "./category.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { healthRouter } from "./health.routes.js";
import { menuItemRouter } from "./menu-item.routes.js";
import { orderRouter } from "./order.routes.js";
import { restaurantTableRouter } from "./restaurant-table.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authProfileRouter);
apiRouter.use("/V1/auth", authRouter);
apiRouter.use("/V1/categories", categoryRouter);
apiRouter.use("/V1/menu-items", menuItemRouter);
apiRouter.use("/V1/tables", restaurantTableRouter);
apiRouter.use("/V1/orders", orderRouter);
apiRouter.use("/V1/dashboard", dashboardRouter);
