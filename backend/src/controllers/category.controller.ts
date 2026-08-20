import type { RequestHandler } from "express";

import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "../services/category.service.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";
import { idParamSchema } from "../validators/common.validator.js";

export const list: RequestHandler = async (_req, res, next) => {
  try {
    const categories = await listCategories();
    res.status(200).json({ data: { categories } });
  } catch (error) {
    next(error);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const category = await getCategoryById(id);
    res.status(200).json({ data: { category } });
  } catch (error) {
    next(error);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await createCategory(input);
    res.status(201).json({ data: { category } });
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateCategorySchema.parse(req.body);
    const category = await updateCategory(id, input);
    res.status(200).json({ data: { category } });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await deleteCategory(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

