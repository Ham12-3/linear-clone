import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { can, type WorkspaceAction, type WorkspaceRole } from "@/lib/permissions";

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class ResourceNotFoundError extends Error {
  constructor(message = "The requested resource could not be found.") {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export const getWorkspaceMembership = cache(async (workspaceSlug: string, userId: string) => {
  return prisma.workspaceMember.findFirst({
    where: { userId, workspace: { slug: workspaceSlug } },
    include: { workspace: true, user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });
});

export async function requireWorkspaceMembership(workspaceSlug: string, userId: string, action?: WorkspaceAction) {
  const membership = await getWorkspaceMembership(workspaceSlug, userId);
  if (!membership) throw new ResourceNotFoundError();
  if (action && !can(membership.role as WorkspaceRole, action)) throw new AuthorizationError();
  return membership;
}

export async function listUserWorkspaces(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    select: { role: true, workspace: { select: { id: true, name: true, slug: true, icon: true } } },
    orderBy: { joinedAt: "asc" },
  });
}
