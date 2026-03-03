import crypto from "crypto";

export function generateActivationToken(): string {
  // 48 bytes = 384 bits of entropy, hex-encoded (96 chars)
  return crypto.randomBytes(48).toString("hex");
}

export function tokenExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}
