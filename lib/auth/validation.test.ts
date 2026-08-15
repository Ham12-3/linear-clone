import { describe, expect, it } from "vitest";
import { loginSchema, passwordSchema, signupSchema } from "./validation";

describe("authentication validation", () => {
  it("normalizes email addresses", () => {
    const result = loginSchema.parse({ email: "  PERSON@EXAMPLE.COM ", password: "secret" });
    expect(result.email).toBe("person@example.com");
  });

  it("requires passwords with mixed character classes", () => {
    expect(passwordSchema.safeParse("onlylowercase").success).toBe(false);
    expect(passwordSchema.safeParse("OrbitSecure7").success).toBe(true);
  });

  it("rejects malformed signup input", () => {
    expect(signupSchema.safeParse({ name: "A", email: "bad", password: "short" }).success).toBe(false);
  });
});
