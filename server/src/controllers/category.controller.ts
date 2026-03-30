import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';

async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const categories = await categoryService.getAll(userId);
    res.json(categories);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const category = await categoryService.create(userId, req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const category = await categoryService.update(userId, id, req.body);
    res.json(category);
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await categoryService.remove(userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const categoryController = { getAll, create, update, remove };
