// src/interfaces/http/middlewares/requireAuth.ts

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

    // 🔍 DEBUG
    console.log("Auth header received:", header?.substring(0, 60) + "...");

    if (!header || !header.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid Authorization header");
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Missing or invalid Authorization header",
        },
      });
      return;
    }

    const token = header.slice("Bearer ".length);
    console.log("Token extracted (first 60 chars):", token.substring(0, 60) + "...");

    try {
      const payload = jwtService.verify(token);
      console.log("✅ JWT verified successfully!");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // ✅ Use driverId from payload (not sub)
      if (!payload.driverId) {
        console.log("❌ Missing driverId in payload");
        throw new Error("Missing driverId in token");
      }

      // Attach driverId to request
      (req as AuthenticatedRequest).driverId =
        asDriverId(payload.driverId);

      console.log("✅ driverId attached to request:", payload.driverId);
      next();
    } catch (error) {
      console.error("❌ JWT Verification failed!");
      console.error("Error:", error);
      
      res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token",
        },
      });
    }
  };
}
