"use server";

import { StatusCategory } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { workspaceSetupSchema } from "@/lib/workspaces/validation";
import type { WorkspaceSetupState } from "@/lib/workspaces/action-state";

export async function createWorkspaceAction(_: WorkspaceSetupState, formData: FormData): Promise<WorkspaceSetupState> {
  const session = await auth();
  if (!session?.user.id) return { status: "error", message: "Sign in before creating a workspace." };
  const parsed = workspaceSetupSchema.safeParse({
    workspaceName: formData.get("workspaceName"), workspaceSlug: formData.get("workspaceSlug"), teamName: formData.get("teamName"), teamKey: formData.get("teamKey"),
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { status: "error", fieldErrors: Object.fromEntries(Object.entries(errors).filter((entry): entry is [string, string[]] => Boolean(entry[1]))) };
  }
  const existing = await prisma.workspace.findUnique({ where: { slug: parsed.data.workspaceSlug } });
  if (existing) return { status: "error", fieldErrors: { workspaceSlug: ["This workspace URL is already in use"] } };

  await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: { name: parsed.data.workspaceName, slug: parsed.data.workspaceSlug, icon: parsed.data.workspaceName[0]?.toUpperCase() } });
    const member = await tx.workspaceMember.create({ data: { workspaceId: workspace.id, userId: session.user.id, role: "OWNER" } });
    const team = await tx.team.create({ data: { workspaceId: workspace.id, name: parsed.data.teamName, key: parsed.data.teamKey, color: "#6659d9", members: { create: { memberId: member.id } } } });
    await tx.issueStatus.createMany({ data: [
      { teamId: team.id, name: "Backlog", color: "#8c9099", category: StatusCategory.BACKLOG, position: 0 },
      { teamId: team.id, name: "Todo", color: "#727783", category: StatusCategory.UNSTARTED, position: 1 },
      { teamId: team.id, name: "In progress", color: "#6659d9", category: StatusCategory.STARTED, position: 2 },
      { teamId: team.id, name: "In review", color: "#d38a32", category: StatusCategory.STARTED, position: 3 },
      { teamId: team.id, name: "Done", color: "#2b9a73", category: StatusCategory.COMPLETED, position: 4 },
      { teamId: team.id, name: "Cancelled", color: "#9a6262", category: StatusCategory.CANCELLED, position: 5 },
    ] });
    await tx.label.createMany({ data: [
      { workspaceId: workspace.id, name: "Bug", color: "#d95b59" },
      { workspaceId: workspace.id, name: "Feature", color: "#3188c7" },
      { workspaceId: workspace.id, name: "Improvement", color: "#7a67d8" },
    ] });
    await tx.activity.create({ data: { workspaceId: workspace.id, actorId: session.user.id, type: "WORKSPACE_CREATED", metadata: { teamId: team.id } } });
  });
  redirect(`/${parsed.data.workspaceSlug}/issues`);
}
