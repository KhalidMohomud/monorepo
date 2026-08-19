import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
