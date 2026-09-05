import { createHmac, timingSafeEqual } from "node:crypto";

// Stateless, signed short-lived tokens that carry a user id through the
// account-recovery wizard (lookup -> answer questions -> reset password)
// without needing a server-side session table. Signed with the service
// role key so no extra secret needs to be provisioned.
const TTL_MS = 10 * 60 * 1000;

type Purpose = "answer" | "reset";

function secret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY!;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createRecoveryToken(userId: string, purpose: Purpose): string {
  const payload = `${userId}:${purpose}:${Date.now() + TTL_MS}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(payload)}`;
}

export function verifyRecoveryToken(
  token: string,
  purpose: Purpose
): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  const expectedSignature = sign(payload);

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  const [userId, tokenPurpose, expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);
  if (!userId || tokenPurpose !== purpose || !Number.isFinite(expiresAt)) {
    return null;
  }
  if (Date.now() > expiresAt) return null;

  return userId;
}
