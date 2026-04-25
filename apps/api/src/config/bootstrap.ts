import { Express } from "express";

export interface AppConfig {
  port: number;
  env: "development" | "production" | "test";
  apiPrefix: string;
  corsOrigins: string[];
  shutdownTimeoutMs: number;
}

export function loadConfig(): AppConfig {
  const env = (process.env.NODE_ENV ?? "development") as AppConfig["env"];
  return {
    port: parseInt(process.env.PORT ?? "3000", 10),
    env,
    apiPrefix: process.env.API_PREFIX ?? "/api/v1",
    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(","),
    shutdownTimeoutMs: parseInt(process.env.SHUTDOWN_TIMEOUT_MS ?? "5000", 10),
  };
}

export function validateConfig(cfg: AppConfig): void {
  if (isNaN(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
    throw new Error(`Invalid PORT: ${cfg.port}`);
  }
  if (!["development", "production", "test"].includes(cfg.env)) {
    throw new Error(`Invalid NODE_ENV: ${cfg.env}`);
  }
}

export function assembleApp(app: Express, cfg: AppConfig): void {
  app.set("env", cfg.env);
  app.set("x-powered-by", false);
  app.locals.config = cfg;
}

export function gracefulShutdown(
  server: { close: (cb: () => void) => void },
  cfg: AppConfig
): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(), cfg.shutdownTimeoutMs);
    server.close(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}
