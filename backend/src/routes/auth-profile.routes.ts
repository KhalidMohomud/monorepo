import { Router } from "express";

import { me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const authProfileRouter = Router();

authProfileRouter.get("/me", authenticate, me);
