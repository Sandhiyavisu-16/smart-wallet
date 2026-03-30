import { Request, Response, NextFunction } from 'express';
import { investmentService } from '../services/investment.service';

async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const investments = await investmentService.getAll(userId);
    res.json(investments);
  } catch (error) {
    next(error);
  }
}

async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const result = await investmentService.summary(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const investment = await investmentService.create(userId, req.body);
    res.status(201).json(investment);
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const investment = await investmentService.update(userId, id, req.body);
    res.json(investment);
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await investmentService.remove(userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const investmentController = { getAll, summary, create, update, remove };
