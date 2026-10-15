import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = req.requestId || (req.headers["x-request-id"] as string) || "req_" + Date.now();

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      meta: { requestId },
    });
  }

  const statusCode = err.statusCode || (err.status && typeof err.status === "number" ? err.status : 500);
  const message = err.message || "An unexpected internal server error occurred.";

  console.error(`[Error] [${requestId}] ${req.method} ${req.url}:`, err);

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message,
    },
    meta: { requestId },
  });
}
