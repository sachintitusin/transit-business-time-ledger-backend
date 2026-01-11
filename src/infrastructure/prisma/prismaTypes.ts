import { PrismaClient } from "../../../generated/prisma/client";


// This is the exact type Prisma gives inside $transaction
export type PrismaTxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

// What repositories actually depend on
export type PrismaClientLike = PrismaClient | PrismaTxClient;
