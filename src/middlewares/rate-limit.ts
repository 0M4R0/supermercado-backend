import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Protected routers run authMiddleware before these limiters, so a quota is
 * assigned to the authenticated user instead of being shared by their IP.
 */
const authenticatedKey = (req: Request) =>
  req.user?.id
    ? `user:${req.user.id}`
    : `ip:${ipKeyGenerator(req.ip ?? "unknown")}`;

// API writes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 250,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: authenticatedKey,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

// Authenticated API requests
export const apiAuthenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: authenticatedKey,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

// Public catalog
export const catalogLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

// Avoid sudden amount of requests [Catalog]
export const slowLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});
