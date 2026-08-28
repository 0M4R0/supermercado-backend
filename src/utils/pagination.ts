export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationParams = {
  page: number;
  limit: number;
  from: number;
  to: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export function parsePagination(
  pageRaw: unknown,
  limitRaw: unknown,
): PaginationParams {
  const page = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      parseInt(String(limitRaw ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE,
    ),
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: Pick<PaginationParams, "page" | "limit">,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page: pagination.page,
    limit: pagination.limit,
    total_pages: Math.ceil(total / pagination.limit),
  };
}
