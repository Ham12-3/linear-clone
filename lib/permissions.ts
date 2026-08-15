export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
export type WorkspaceAction = "workspace.delete" | "members.manage" | "teams.manage" | "projects.create" | "issues.create" | "issues.update" | "comments.create";

const grants: Record<WorkspaceRole, ReadonlySet<WorkspaceAction>> = {
  OWNER: new Set(["workspace.delete", "members.manage", "teams.manage", "projects.create", "issues.create", "issues.update", "comments.create"]),
  ADMIN: new Set(["members.manage", "teams.manage", "projects.create", "issues.create", "issues.update", "comments.create"]),
  MEMBER: new Set(["projects.create", "issues.create", "issues.update", "comments.create"]),
  GUEST: new Set(["comments.create"]),
};

export function can(role: WorkspaceRole, action: WorkspaceAction): boolean {
  return grants[role].has(action);
}
