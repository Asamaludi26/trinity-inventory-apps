export interface PaginatedResult<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  tokenVersion: number;
  [key: string]: unknown;
}
