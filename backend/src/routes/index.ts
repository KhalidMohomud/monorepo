import { Router } from "express";

import { authProfileRouter } from "./auth-profile.routes.js";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authProfileRouter);
apiRouter.use("/V1/auth", authRouter);
