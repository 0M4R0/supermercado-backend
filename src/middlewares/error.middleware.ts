import type { NextFunction, Request, Response } from "express";

interface AppError extends Error {
  status?: number;
  statusCode?: number;
  cause?: unknown;
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const error = err as AppError;

  const rawStatus = error.status ?? error.statusCode ?? 500;
  const safeStatus = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;

  // Report error to console
  console.error("[error]", {
    status: safeStatus,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    cause: error.cause,
  });

  if (res.headersSent) {
    return;
  }

  // Default to "Error interno" if no specific message is available
  const clientMessage =
    safeStatus === 500
      ? "Error interno"
      : error instanceof Error
        ? error.message
        : "Error interno";

  res.status(safeStatus).json({ error: clientMessage });
}
