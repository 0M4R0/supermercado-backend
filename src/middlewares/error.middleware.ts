import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

/**
 * Final error middleware. Logs full details server-side and always
 * responds with a generic JSON body (never stack traces or HTML).
 *
 * Signature must keep 4 args so Express treats this as an error handler.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : typeof err === "object" &&
          err !== null &&
          "statusCode" in err &&
          typeof (err as { statusCode: unknown }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : 500;

  const safeStatus = status >= 400 && status < 600 ? status : 500;

  console.error("[error]", {
    status: safeStatus,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    cause:
      err instanceof Error && "cause" in err
        ? (err as Error & { cause?: unknown }).cause
        : undefined,
  });

  if (res.headersSent) {
    return;
  }

  const clientMessage =
    safeStatus === 500
      ? "Error interno"
      : err instanceof Error && err.message
        ? err.message
        : "Error interno";

  res.status(safeStatus).json({
    error: safeStatus === 500 ? "Error interno" : clientMessage,
  });
}
