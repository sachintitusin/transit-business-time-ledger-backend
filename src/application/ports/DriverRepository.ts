import { DriverId } from '../../domain/shared/types';

export interface Driver {
  id: DriverId;
  email: string;
  name?: string;
}

export interface DriverRepository {
  findByEmail(email: string): Promise<Driver | null>;
  findById(id: DriverId): Promise<Driver | null>;
  save(driver: Driver): Promise<void>;
}
