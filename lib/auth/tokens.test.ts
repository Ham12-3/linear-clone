import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashToken } from "./tokens";

describe("opaque auth tokens", () => {
  it("returns only a deterministic hash for persistence", () => {
    const token = createOpaqueToken();
    expect(token.raw.length).toBeGreaterThanOrEqual(40);
    expect(token.hash).toBe(hashToken(token.raw));
    expect(token.hash).not.toContain(token.raw);
  });

  it("creates distinct secrets", () => expect(createOpaqueToken().raw).not.toBe(createOpaqueToken().raw));
});
