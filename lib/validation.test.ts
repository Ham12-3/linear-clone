import { describe, expect, it } from "vitest";
import { getFractionalRank, issueInputSchema } from "./validation";

describe("issue validation", () => {
  it("accepts a concise valid issue", () => {
    expect(issueInputSchema.safeParse({ title: "Fix search latency", team: "ENG", status: "todo", priority: "high" }).success).toBe(true);
  });

  it("rejects blank titles", () => {
    expect(issueInputSchema.safeParse({ title: " ", team: "ENG", status: "todo", priority: "high" }).success).toBe(false);
  });
});

describe("fractional ranking", () => {
  it("places a rank between neighbours", () => expect(getFractionalRank(1000, 2000)).toBe(1500));
  it("places a rank after the last item", () => expect(getFractionalRank(3000)).toBe(4000));
});
