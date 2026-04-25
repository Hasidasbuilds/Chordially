import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { AppError } from "./errors";

export interface ValidationTargets {
  body?:    ZodSchema;
  query?:   ZodSchema;
  params?:  ZodSchema;
  headers?: ZodSchema;
}

export function validate(targets: ValidationTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, z.ZodIssue[]> = {};

    for (const [target, schema] of Object.entries(targets) as [keyof ValidationTargets, ZodSchema][]) {
      const result = schema.safeParse(req[target as keyof Request]);
      if (!result.success) errors[target] = result.error.issues;
    }

    if (Object.keys(errors).length > 0) {
      return next(new AppError("VALIDATION_ERROR", "Request validation failed", 422, errors));
    }

    next();
  };
}

// Composable schema fragments
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const socketEventSchema = <T extends ZodSchema>(payloadSchema: T) =>
  z.object({
    eventId:   z.string().uuid(),
    timestamp: z.string().datetime(),
    payload:   payloadSchema,
  });

export function validateSocketEvent<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Socket payload validation failed", 422, result.error.issues);
  }
  return result.data;
}
