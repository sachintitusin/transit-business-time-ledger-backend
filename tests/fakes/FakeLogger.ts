import { AppLogger } from '../../src/application/ports/Logger';

export class FakeLogger implements AppLogger {
  info(): void {}
  warn(): void {}
  error(): void {}
}
