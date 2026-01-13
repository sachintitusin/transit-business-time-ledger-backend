import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../../application/ports/JwtService";
import { asDriverId } from "../../../domain/shared/types";
import { AuthenticatedRequest } from "../types/AuthRequest";

export function requireAuth(jwtService: JwtService) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Missing or invalid Authorization header",
        },
      });
      return;
    }

    const token = header.slice("Bearer ".length);

    try {
      const payload = jwtService.verify(token);

      if (!payload.sub) {
        throw new Error("Missing subject");
      }

      // safely attach driverId
      (req as AuthenticatedRequest).driverId =
        asDriverId(payload.sub);

      next();
    } catch {
      res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token",
        },
      });
    }
  };
}
