import { TransactionManager } from "../../src/application/ports/TransactionManager";

export class FakeTransactionManager implements TransactionManager {
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
