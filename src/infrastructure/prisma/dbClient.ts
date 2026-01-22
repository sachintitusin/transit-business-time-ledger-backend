import { PrismaClient } from "../../generated/prisma/client";


/**
 * This is the ONLY thing repositories depend on.
 * It matches BOTH PrismaClient and transaction tx client.
 */
export type DbClient = {
  workPeriod: PrismaClient["workPeriod"];
  workCorrection: PrismaClient["workCorrection"];
  leaveEvent: PrismaClient["leaveEvent"];
  leaveCorrection: PrismaClient["leaveCorrection"];
  shiftTransferEvent: PrismaClient["shiftTransferEvent"];
  authIdentity: PrismaClient["authIdentity"];
  driver: PrismaClient["driver"]
  entryProjection: PrismaClient["entryProjection"];
};
