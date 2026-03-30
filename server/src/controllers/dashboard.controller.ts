import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';

async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const result = await dashboardService.summary(userId, { month, year });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function chart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const result = await dashboardService.chart(userId, { month, year });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function comparison(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const result = await dashboardService.comparison(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export const dashboardController = { summary, chart, comparison };
