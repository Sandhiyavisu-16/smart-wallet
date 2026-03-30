import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';

async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { page, limit, category, type, from, to, search } = req.query;
    const result = await transactionService.getAll(userId, {
      page: page as string | undefined,
      limit: limit as string | undefined,
      category: category as string | undefined,
      type: type as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      search: search as string | undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const transaction = await transactionService.getById(userId, id);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const transaction = await transactionService.create(userId, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const transaction = await transactionService.update(userId, id, req.body);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await transactionService.remove(userId, id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function exportCSV(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const csv = await transactionService.exportCSV(userId, req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export const transactionController = { getAll, getById, create, update, remove, exportCSV };
