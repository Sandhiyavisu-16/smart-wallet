import { Request, Response, NextFunction } from 'express';
import { budgetService } from '../services/budget.service';

async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { month, year } = req.query;
    const budgets = await budgetService.getAll(userId, {
      month: month as string | undefined,
      year: year as string | undefined,
    });
    res.json(budgets);
  } catch (error) {
    next(error);
  }
}

async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { month, year } = req.query;
    const result = await budgetService.summary(userId, {
      month: month as string | undefined,
      year: year as string | undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const budget = await budgetService.create(userId, req.body);
    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const budget = await budgetService.update(userId, id, req.body);
    res.json(budget);
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await budgetService.remove(userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const budgetController = { getAll, summary, create, update, remove };
