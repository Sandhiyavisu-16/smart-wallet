import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export function paginate(params: PaginationParams) {
  const { page, limit } = params;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams) {
  const { page, limit } = params;
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
