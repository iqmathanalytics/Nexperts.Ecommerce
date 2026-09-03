import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { AppError, fail } from "../utils/http";
import { isProd } from "../config/env";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json(fail("FILE_TOO_LARGE", "Image must be 5MB or smaller"));
    }
    return res.status(400).json(fail("UPLOAD_FAILED", err.message));
  }
  if (err instanceof AppError) {
    return res.status(err.status).json(fail(err.code, err.message));
  }
  if (err instanceof ZodError) {
    const issue = err.errors[0];
    const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    const message = `${path}${issue?.message ?? "Validation failed"}`;
    return res.status(422).json(fail("VALIDATION_ERROR", message));
  }
  console.error(err);
  const message = isProd ? "Something went wrong" : err instanceof Error ? err.message : "Unknown error";
  return res.status(500).json(fail("INTERNAL_ERROR", message));
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json(fail("NOT_FOUND", "Route not found"));
}
