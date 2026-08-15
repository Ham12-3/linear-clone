import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("workspace permissions", () => {
  it("allows owners to delete a workspace", () => expect(can("OWNER", "workspace.delete")).toBe(true));
  it("prevents members from managing members", () => expect(can("MEMBER", "members.manage")).toBe(false));
  it("limits guests to collaboration", () => {
    expect(can("GUEST", "comments.create")).toBe(true);
    expect(can("GUEST", "issues.update")).toBe(false);
  });
});
