export class DomainError extends Error {
  readonly code: string
  readonly details?: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message)

    this.code = code
    this.details = details

    // Restore prototype chain (important in TS)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
