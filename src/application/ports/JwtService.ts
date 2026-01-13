// src/application/ports/JwtService.ts

export interface JwtPayload {
  sub: string;        // driverId (uuid)
  email?: string;
  driverId: string;
}

export interface JwtService {
  sign(payload: JwtPayload): string;
  verify(token: string): JwtPayload;
}
