import { describe, expect, it } from "vitest";
import { workspaceSetupSchema } from "./validation";

describe("workspace setup validation", () => {
  it("normalizes a valid team and slug", () => {
    const value = workspaceSetupSchema.parse({ workspaceName: "Orbit Labs", workspaceSlug: "orbit-labs", teamName: "Engineering", teamKey: "eng" });
    expect(value.teamKey).toBe("ENG");
  });

  it("rejects unsafe or ambiguous slugs", () => {
    expect(workspaceSetupSchema.safeParse({ workspaceName: "Orbit", workspaceSlug: "Orbit Labs!", teamName: "Engineering", teamKey: "ENG" }).success).toBe(false);
  });
});
