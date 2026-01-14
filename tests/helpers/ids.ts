// tests/helpers/ids.ts
import { randomUUID } from "crypto";

export function makeIds<T extends string>(keys: readonly T[]) {
  return Object.fromEntries(
    keys.map(k => [k, randomUUID()])
  ) as Record<T, string>;
}
