import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

// Normalize so "Blue" and " blue " hash the same way at verification time.
function normalize(answer: string) {
  return answer.trim().toLowerCase();
}

export function hashSecurityAnswer(answer: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(normalize(answer), salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifySecurityAnswer(answer: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(normalize(answer), salt, KEY_LENGTH);
  return (
    candidate.length === hashBuffer.length &&
    timingSafeEqual(candidate, hashBuffer)
  );
}
