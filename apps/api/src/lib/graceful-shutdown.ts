import type { Server } from "http";
import type { Server as SocketServer } from "socket.io";

interface ShutdownDeps {
  httpServer: Server;
  io?: SocketServer;
  redisQuit?: () => Promise<void>;
  dbDisconnect?: () => Promise<void>;
}

const DRAIN_TIMEOUT_MS = 10_000;

export function registerGracefulShutdown(deps: ShutdownDeps): void {
  let isShuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`[shutdown] received ${signal}, draining connections…`);

    const timer = setTimeout(() => {
      console.error("[shutdown] drain timeout exceeded, forcing exit");
      process.exit(1);
    }, DRAIN_TIMEOUT_MS);

    try {
      await new Promise<void>((resolve, reject) =>
        deps.httpServer.close((err) => (err ? reject(err) : resolve()))
      );
      console.log("[shutdown] HTTP server closed");

      if (deps.io) {
        await new Promise<void>((resolve) => deps.io!.close(() => resolve()));
        console.log("[shutdown] Socket.IO closed");
      }

      if (deps.redisQuit) {
        await deps.redisQuit();
        console.log("[shutdown] Redis disconnected");
      }

      if (deps.dbDisconnect) {
        await deps.dbDisconnect();
        console.log("[shutdown] DB disconnected");
      }

      clearTimeout(timer);
      console.log("[shutdown] clean exit");
      process.exit(0);
    } catch (err) {
      console.error("[shutdown] error during drain", err);
      clearTimeout(timer);
      process.exit(1);
    }
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
