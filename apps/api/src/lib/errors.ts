import { Request, Response, NextFunction } from "express";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

const STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  AUTH_REQUIRED:    401,
  FORBIDDEN:        403,
  NOT_FOUND:        404,
  CONFLICT:         409,
  RATE_LIMITED:     429,
  INTERNAL_ERROR:   500,
};

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    if (err.name === "UnauthorizedError") return new AppError("AUTH_REQUIRED", err.message, 401);
    if (err.name === "ValidationError")   return new AppError("VALIDATION_ERROR", err.message, 422);
  }
  return new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const mapped = toAppError(err);
  const status = STATUS_MAP[mapped.code] ?? 500;
  res.status(status).json({
    error: { code: mapped.code, message: mapped.message, details: mapped.details ?? null },
  });
}
