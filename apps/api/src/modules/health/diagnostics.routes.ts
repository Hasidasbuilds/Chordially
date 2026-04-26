import { Router, type Request, type Response } from "express";

const router = Router();

interface DepCheck {
  name: string;
  check: () => Promise<boolean>;
}

const deps: DepCheck[] = [];

export function registerDependency(name: string, check: () => Promise<boolean>): void {
  deps.push({ name, check });
}

/** GET /health — liveness probe: is the process alive? */
router.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

/** GET /health/ready — readiness probe: are all deps up? */
router.get("/health/ready", async (_req: Request, res: Response): Promise<void> => {
  const results = await Promise.all(
    deps.map(async ({ name, check }) => {
      try {
        const ok = await check();
        return { name, status: ok ? "ok" : "degraded" };
      } catch {
        return { name, status: "error" };
      }
    })
  );

  const allOk = results.every((r) => r.status === "ok");
  res.status(allOk ? 200 : 503).json({
    ready: allOk,
    dependencies: results,
    ts: new Date().toISOString(),
  });
});

/** GET /health/diagnostics — detailed dependency info (internal use) */
router.get("/health/diagnostics", async (_req: Request, res: Response): Promise<void> => {
  const start = Date.now();
  const checks = await Promise.all(
    deps.map(async ({ name, check }) => {
      const t0 = Date.now();
      try {
        const ok = await check();
        return { name, status: ok ? "ok" : "degraded", latencyMs: Date.now() - t0 };
      } catch (err) {
        return { name, status: "error", latencyMs: Date.now() - t0, error: String(err) };
      }
    })
  );

  res.json({ uptime: process.uptime(), totalMs: Date.now() - start, checks });
});

export { router as healthRouter };
