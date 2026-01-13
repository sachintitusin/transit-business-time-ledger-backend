import { Request } from "express";
import { DriverId } from "../../../domain/shared/types";

export interface AuthenticatedRequest extends Request {
  driverId?: DriverId;
}
