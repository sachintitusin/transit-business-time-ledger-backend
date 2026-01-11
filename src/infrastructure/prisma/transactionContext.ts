import { AsyncLocalStorage } from "async_hooks";
import { prisma } from "./prismaClient";
import { DbClient } from "./dbClient";

const storage = new AsyncLocalStorage<DbClient>();

export const transactionContext = {
  run<T>(client: DbClient, fn: () => Promise<T>): Promise<T> {
    return storage.run(client, fn);
  },

  get(): DbClient {
    return storage.getStore() ?? prisma;
  },
};
