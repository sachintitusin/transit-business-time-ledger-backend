import { DriverRepository, Driver } from '../../application/ports/DriverRepository';
import { asDriverId } from '../../domain/shared/types';
import { transactionContext } from '../prisma/transactionContext';

export class PrismaDriverRepository implements DriverRepository {

  async findByEmail(email: string): Promise<Driver | null> {
    const row = await transactionContext.get().driver.findUnique({
      where: { email },
    });

    if (!row) return null;

    return {
      id: asDriverId(row.id),
      email: row.email,
      name: row.name ?? undefined,
    };
  }

  async save(driver: Driver): Promise<void> {
    await transactionContext.get().driver.create({
      data: {
        id: driver.id as any,
        email: driver.email,
        name: driver.name,
      },
    });
  }
}
