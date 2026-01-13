export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  email_verified: boolean;
}

export interface GoogleTokenVerifier {
  verify(idToken: string): Promise<GoogleProfile>;
}
