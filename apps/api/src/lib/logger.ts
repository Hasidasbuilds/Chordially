import { Request, Response, NextFunction } from "express";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  eventId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function emit(entry: LogEntry): void {
  process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
}

export const logger = {
  debug: (message: string, meta?: Partial<LogEntry>) => emit({ level: "debug", message, ...meta }),
  info:  (message: string, meta?: Partial<LogEntry>) => emit({ level: "info",  message, ...meta }),
  warn:  (message: string, meta?: Partial<LogEntry>) => emit({ level: "warn",  message, ...meta }),
  error: (message: string, meta?: Partial<LogEntry>) => emit({ level: "error", message, ...meta }),
};

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = (req.headers["x-request-id"] as string) ?? crypto.randomUUID();
  const userId = (req as Request & { user?: { id: string } }).user?.id;

  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    logger.info("request", {
      requestId,
      userId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
}

export function jobLogger(jobName: string, jobId: string) {
  return {
    start: () => logger.info("job.start", { eventId: jobId, job: jobName }),
    done:  (durationMs: number) => logger.info("job.done", { eventId: jobId, job: jobName, durationMs }),
    fail:  (err: Error) => logger.error("job.fail", { eventId: jobId, job: jobName, error: err.message }),
  };
}
