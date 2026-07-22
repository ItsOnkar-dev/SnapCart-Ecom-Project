export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const getPaginationParams = (
  query: { page?: string; limit?: string },
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): PaginationParams => {
  const rawPage = parseInt(query.page ?? "", 10) || defaults.page;
  const page = Math.max(1, rawPage ?? 1);
  const rawLimit = parseInt(query.limit ?? "", 10) || defaults.limit;
  const limit = Math.min(
    defaults.maxLimit ?? 100,
    Math.max(1, rawLimit ?? 10),
  );
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPaginationResult = (
  total: number,
  params: PaginationParams,
): PaginationResult => ({
  page: params.page,
  limit: params.limit,
  total,
  totalPages: Math.ceil(total / params.limit) || 1,
  hasNextPage: params.page * params.limit < total,
  hasPrevPage: params.page > 1,
});
