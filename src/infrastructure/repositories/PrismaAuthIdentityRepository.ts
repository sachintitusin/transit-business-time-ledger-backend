import {
  AuthIdentityRepository,
  AuthIdentity,
} from '../../application/ports/AuthIdentityRepository';
import { asDriverId } from '../../domain/shared/types';
import { transactionContext } from '../prisma/transactionContext';

export class PrismaAuthIdentityRepository
  implements AuthIdentityRepository
{
  async findByProviderAndUserId(
    provider: 'google',
    providerUserId: string
  ): Promise<AuthIdentity | null> {
    const row = await transactionContext.get().authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
    });

    if (!row) return null;

    return {
      driverId: asDriverId(row.driverId),
      provider: row.provider as 'google',
      providerUserId: row.providerUserId,
      email: row.email,
    };
  }

  async save(identity: AuthIdentity): Promise<void> {
    await transactionContext.get().authIdentity.create({
      data: {
        driverId: identity.driverId as any,
        provider: identity.provider,
        providerUserId: identity.providerUserId,
        email: identity.email,
      },
    });
  }
}
