import { prisma } from "./prismaClient";
import { TransactionManager } from "../../application/ports/TransactionManager";
import { transactionContext } from "./transactionContext";

export class PrismaTransactionManager implements TransactionManager {
  async run<T>(work: () => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => {
      return transactionContext.run(tx, work);
    });
  }
}
