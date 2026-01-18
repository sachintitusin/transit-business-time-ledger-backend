import { AppLogger } from '../../application/ports/Logger'
import { pinoLogger } from './pinoLogger'

export class PinoAppLogger implements AppLogger {
  info(message: string, meta?: Record<string, unknown>) {
    pinoLogger.info(meta ?? {}, message)
  }

  warn(message: string, meta?: Record<string, unknown>) {
    pinoLogger.warn(meta ?? {}, message)
  }

  error(message: string, meta?: Record<string, unknown>) {
    pinoLogger.error(meta ?? {}, message)
  }
}
