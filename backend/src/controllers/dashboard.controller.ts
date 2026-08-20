import type { RequestHandler } from "express";

import { getDashboardOverview } from "../services/dashboard.service.js";

export const overview: RequestHandler = async (_req, res, next) => {
  try {
    const dashboard = await getDashboardOverview();
    res.status(200).json({ data: { dashboard } });
  } catch (error) {
    next(error);
  }
};
