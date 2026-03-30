import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { subscriptionService } from './subscription.service';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

async function getChats(userId: string) {
  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { content: true, role: true, createdAt: true },
      },
    },
  });

  return chats;
}

async function createChat(userId: string) {
  const chat = await prisma.chat.create({
    data: {
      userId,
      title: 'New Chat',
    },
  });

  return chat;
}

async function getChat(userId: string, chatId: string) {
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!chat) {
    throw AppError.notFound('Chat not found');
  }

  return chat;
}

async function sendMessage(userId: string, chatId: string, content: string) {
  // Verify chat ownership
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
  });

  if (!chat) {
    throw AppError.notFound('Chat not found');
  }

  // Check AI query limits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, aiQueriesUsed: true },
  });

  if (!user) throw AppError.notFound('User not found');

  await subscriptionService.checkLimit(userId, 'ai_queries', user.aiQueriesUsed);

  // Increment queries used
  await prisma.user.update({
    where: { id: userId },
    data: { aiQueriesUsed: { increment: 1 } },
  });

  // Save user message
  await prisma.message.create({
    data: {
      chatId,
      role: 'user',
      content,
    },
  });

  // Build financial context
  const financialContext = await buildFinancialContext(userId);

  // Get conversation history
  const history = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Call Claude API with streaming
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a helpful financial advisor assistant for SmartWallet.
Use the following context about the user's finances to give personalized advice.
Be concise, practical, and encouraging. Use specific numbers from their data when relevant.

${financialContext}`,
    messages,
  });

  // Collect the full response
  let assistantResponse = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const text = event.delta.text;
            assistantResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        // Save assistant message after streaming completes
        await prisma.message.create({
          data: {
            chatId,
            role: 'assistant',
            content: assistantResponse,
          },
        });

        // Update chat title from first message if still default
        if (chat.title === 'New Chat') {
          const title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
          await prisma.chat.update({
            where: { id: chatId },
            data: { title },
          });
        }

        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return readable;
}

async function getSuggestedPrompts(userId: string) {
  const [transactionCount, budgetCount, goalCount, investmentCount] = await Promise.all([
    prisma.transaction.count({ where: { userId, deletedAt: null } }),
    prisma.budget.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.investment.count({ where: { userId } }),
  ]);

  const prompts: string[] = [];

  if (transactionCount === 0) {
    prompts.push('How should I start tracking my expenses?');
    prompts.push('What budget categories do you recommend for a beginner?');
  } else {
    prompts.push('Analyze my spending patterns this month');
    prompts.push('Where can I cut expenses to save more?');
  }

  if (budgetCount === 0) {
    prompts.push('Help me create my first budget');
  } else {
    prompts.push('How am I doing with my budgets this month?');
  }

  if (goalCount === 0) {
    prompts.push('What financial goals should I set?');
  } else {
    prompts.push('Am I on track to reach my savings goals?');
  }

  if (investmentCount > 0) {
    prompts.push('Review my investment portfolio diversification');
  } else {
    prompts.push('How should I start investing?');
  }

  return prompts.slice(0, 4);
}

async function getHealthScore(userId: string) {
  const financialContext = await buildFinancialContext(userId);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are a financial health evaluator. Analyze the user's financial data and return ONLY a valid JSON object (no markdown, no explanation outside JSON) with this structure:
{
  "score": <number 1-100>,
  "breakdown": {
    "budgeting": <number 1-100>,
    "savings": <number 1-100>,
    "spending": <number 1-100>,
    "goals": <number 1-100>,
    "investments": <number 1-100>
  },
  "summary": "<brief 1-2 sentence summary>",
  "tips": ["<tip1>", "<tip2>", "<tip3>"]
}`,
    messages: [
      {
        role: 'user',
        content: `Evaluate my financial health based on this data:\n\n${financialContext}`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    return JSON.parse(text);
  } catch {
    return { score: 50, breakdown: {}, summary: text, tips: [] };
  }
}

async function buildFinancialContext(userId: string): Promise<string> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  const [user, recentTransactions, budgets, goals, investments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true, monthlyIncome: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: { gte: startOfMonth, lt: endOfMonth },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }),
    prisma.goal.findMany({
      where: { userId, completedAt: null },
    }),
    prisma.investment.findMany({
      where: { userId },
    }),
  ]);

  const totalExpenses = recentTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncome = recentTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const parts: string[] = [
    `Currency: ${user?.currency ?? 'USD'}`,
    `Monthly Income: ${user?.monthlyIncome ?? 'Not set'}`,
    `This month's income: ${totalIncome}`,
    `This month's expenses: ${totalExpenses}`,
    `Net savings this month: ${totalIncome - totalExpenses}`,
  ];

  if (budgets.length > 0) {
    parts.push(`\nBudgets (${month}/${year}):`);
    for (const b of budgets) {
      parts.push(`  - ${b.category?.name}: ${b.spent}/${b.amount}`);
    }
  }

  if (goals.length > 0) {
    parts.push(`\nActive Goals:`);
    for (const g of goals) {
      parts.push(`  - ${g.name}: ${g.currentAmount}/${g.targetAmount}`);
    }
  }

  if (investments.length > 0) {
    const totalInvested = investments.reduce(
      (s, a) => s + Number(a.quantity) * Number(a.purchasePrice),
      0,
    );
    const currentVal = investments.reduce(
      (s, a) => s + Number(a.quantity) * Number(a.currentPrice),
      0,
    );
    parts.push(`\nInvestments: ${investments.length} assets, invested: ${totalInvested}, current value: ${currentVal}`);
  }

  return parts.join('\n');
}

export const advisorService = {
  getChats,
  createChat,
  getChat,
  sendMessage,
  getSuggestedPrompts,
  getHealthScore,
};
