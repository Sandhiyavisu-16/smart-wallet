import { Request, Response, NextFunction } from 'express';
import { goalService } from '../services/goal.service';

async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const goals = await goalService.getAll(userId);
    res.json(goals);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const goal = await goalService.create(userId, req.body);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const goal = await goalService.update(userId, id, req.body);
    res.json(goal);
  } catch (error) {
    next(error);
  }
}

async function contribute(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount } = req.body;
    const goal = await goalService.contribute(userId, id, amount);
    res.json(goal);
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await goalService.remove(userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const goalController = { getAll, create, update, contribute, remove };
