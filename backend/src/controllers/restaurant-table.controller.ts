import type { RequestHandler } from "express";

import {
  createRestaurantTable,
  deleteRestaurantTable,
  getRestaurantTableById,
  listRestaurantTables,
  updateRestaurantTable,
  updateRestaurantTableStatus,
} from "../services/restaurant-table.service.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  createRestaurantTableSchema,
  restaurantTableQuerySchema,
  updateRestaurantTableSchema,
  updateTableStatusSchema,
} from "../validators/restaurant-table.validator.js";
export const list: RequestHandler = async (req, res, next) => {
  try {
    const query = restaurantTableQuerySchema.parse(req.query);
    const tables = await listRestaurantTables(query);
    res.status(200).json({ data: { tables } });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const table = await getRestaurantTableById(id);
    res.status(200).json({ data: { table } });
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const input = createRestaurantTableSchema.parse(req.body);
    const table = await createRestaurantTable(input);
    res.status(201).json({ data: { table } });
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateRestaurantTableSchema.parse(req.body);
    const table = await updateRestaurantTable(id, input);
    res.status(200).json({ data: { table } });
  } catch (error) {
    next(error);
  }
};

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateTableStatusSchema.parse(req.body);
    const table = await updateRestaurantTableStatus(id, input);
    res.status(200).json({ data: { table } });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await deleteRestaurantTable(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
