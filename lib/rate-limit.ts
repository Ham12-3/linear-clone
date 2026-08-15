import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

interface RateLimitOptions {
  namespace: string;
  identifier: string;
  limit: number;
  windowMs: number;
}

export async function consumeRateLimit({ namespace, identifier, limit, windowMs }: RateLimitOptions): Promise<boolean> {
  const key = createHash("sha256").update(`${namespace}:${identifier.toLowerCase()}`).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  return prisma.$transaction(async (tx) => {
    const bucket = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!bucket || bucket.expiresAt <= now) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now, expiresAt },
        update: { count: 1, windowStart: now, expiresAt },
      });
      return true;
    }
    if (bucket.count >= limit) return false;
    await tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  });
}
