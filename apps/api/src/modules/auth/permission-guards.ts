import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@chordially/types";
import { requireAuth } from "./auth.middleware.js";

type OwnershipResolver = (req: Request) => string | undefined;

/** Require one of the specified roles. Must be used after requireAuth. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(user.role as UserRole)) {
      res.status(403).json({ error: "Insufficient role", required: roles });
      return;
    }
    next();
  };
}

/** Require that the authenticated user owns the resource, or is an admin. */
export function requireOwnerOrAdmin(resolveOwnerId: OwnershipResolver) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (user.role === "admin") {
      next();
      return;
    }
    const ownerId = resolveOwnerId(req);
    if (!ownerId || ownerId !== user.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    next();
  };
}

/** Convenience: authenticate then enforce role in one step. */
export function guard(...roles: UserRole[]) {
  return [requireAuth, requireRole(...roles)];
}

/** Convenience: authenticate then enforce ownership in one step. */
export function guardOwner(resolveOwnerId: OwnershipResolver) {
  return [requireAuth, requireOwnerOrAdmin(resolveOwnerId)];
}
