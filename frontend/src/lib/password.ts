import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const KEY_LEN = 64;

function normalizePassword(password: string): string {
  return password.normalize("NFKC");
}

export function validatePasswordPolicy(password: string): string | null {
  const p = normalizePassword(password);
  if (p.length < 8) return "Password must be at least 8 characters.";
  if (p.length > 128) return "Password is too long.";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const normalized = normalizePassword(password);
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(normalized, salt, KEY_LEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  candidatePassword: string,
  storedHash: string
): Promise<boolean> {
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  const normalized = normalizePassword(candidatePassword);
  const derived = (await scrypt(normalized, salt, KEY_LEN)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

