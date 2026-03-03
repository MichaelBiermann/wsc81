import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.IBAN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("IBAN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export function encryptIBAN(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv(32 hex) + tag(32 hex) + ciphertext(hex)
  return iv.toString("hex") + tag.toString("hex") + encrypted.toString("hex");
}

export function decryptIBAN(stored: string): string {
  const key = getKey();
  const iv = Buffer.from(stored.slice(0, 32), "hex");
  const tag = Buffer.from(stored.slice(32, 64), "hex");
  const ciphertext = Buffer.from(stored.slice(64), "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}

export function ibanLast4(iban: string): string {
  const clean = iban.replace(/\s+/g, "");
  return clean.slice(-4);
}
