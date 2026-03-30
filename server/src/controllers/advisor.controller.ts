import { Request, Response, NextFunction } from 'express';
import { advisorService } from '../services/advisor.service';

async function getChats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const chats = await advisorService.getChats(userId);
    res.json(chats);
  } catch (error) {
    next(error);
  }
}

async function createChat(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const chat = await advisorService.createChat(userId);
    res.status(201).json(chat);
  } catch (error) {
    next(error);
  }
}

async function getChat(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const chat = await advisorService.getChat(userId, id);
    res.json(chat);
  } catch (error) {
    next(error);
  }
}

async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await advisorService.sendMessage(userId, id, content);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

async function getSuggestedPrompts(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const prompts = await advisorService.getSuggestedPrompts(userId);
    res.json(prompts);
  } catch (error) {
    next(error);
  }
}

async function getHealthScore(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const score = await advisorService.getHealthScore(userId);
    res.json(score);
  } catch (error) {
    next(error);
  }
}

export const advisorController = {
  getChats,
  createChat,
  getChat,
  sendMessage,
  getSuggestedPrompts,
  getHealthScore,
};
