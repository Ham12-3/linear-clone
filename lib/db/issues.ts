import { Prisma, Priority, StatusCategory } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AuthorizationError, ResourceNotFoundError, requireWorkspaceMembership } from "@/lib/db/workspaces";
import type { WorkspaceRole } from "@/lib/permissions";

const issueInclude = {
  status: { select: { id: true, name: true, color: true, category: true } },
  team: { select: { id: true, name: true, key: true, color: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  project: { select: { id: true, name: true, color: true } },
  cycle: { select: { id: true, name: true, number: true } },
  labels: { include: { label: true } },
  _count: { select: { comments: { where: { deletedAt: null } }, children: { where: { deletedAt: null } } } },
} satisfies Prisma.IssueInclude;

export interface IssueListQuery {
  cursor?: string;
  take?: number;
  statusId?: string;
  priority?: Priority;
  assigneeId?: string;
  projectId?: string;
  search?: string;
}

export async function listWorkspaceIssues(workspaceSlug: string, userId: string, query: IssueListQuery = {}) {
  const membership = await requireWorkspaceMembership(workspaceSlug, userId);
  const take = Math.min(Math.max(query.take ?? 50, 1), 100);
  const where: Prisma.IssueWhereInput = {
    workspaceId: membership.workspaceId,
    deletedAt: null,
    ...(query.statusId ? { statusId: query.statusId } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { team: { key: { equals: query.search.toUpperCase() } } }] } : {}),
  };
  const issues = await prisma.issue.findMany({
    where,
    include: issueInclude,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });
  const hasMore = issues.length > take;
  const page = hasMore ? issues.slice(0, take) : issues;
  return { issues: page, nextCursor: hasMore ? page.at(-1)?.id ?? null : null };
}

export interface CreateIssueInput {
  teamId: string;
  title: string;
  description?: Prisma.InputJsonValue;
  statusId?: string;
  priority?: Priority;
  assigneeId?: string | null;
  projectId?: string | null;
  cycleId?: string | null;
  dueDate?: Date | null;
  estimate?: number | null;
}

export async function createWorkspaceIssue(workspaceSlug: string, actorId: string, input: CreateIssueInput) {
  const membership = await requireWorkspaceMembership(workspaceSlug, actorId, "issues.create");
  const title = input.title.trim();
  if (title.length < 2 || title.length > 180) throw new Error("Issue titles must contain between 2 and 180 characters.");

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findFirst({ where: { id: input.teamId, workspaceId: membership.workspaceId } });
    if (!team) throw new ResourceNotFoundError("Team not found in this workspace.");
    const status = input.statusId
      ? await tx.issueStatus.findFirst({ where: { id: input.statusId, teamId: team.id } })
      : await tx.issueStatus.findFirst({ where: { teamId: team.id, category: StatusCategory.UNSTARTED }, orderBy: { position: "asc" } });
    if (!status) throw new ResourceNotFoundError("The issue status is not available for this team.");

    await validateIssueRelations(tx, membership.workspaceId, input);
    const sequence = await tx.team.update({ where: { id: team.id }, data: { issueCounter: { increment: 1 } }, select: { issueCounter: true } });
    const lastIssue = await tx.issue.findFirst({ where: { teamId: team.id, statusId: status.id, deletedAt: null }, orderBy: { rank: "desc" }, select: { rank: true } });
    const rank = lastIssue ? new Prisma.Decimal(lastIssue.rank).plus(1000) : new Prisma.Decimal(1000);
    const issue = await tx.issue.create({
      data: {
        workspaceId: membership.workspaceId,
        teamId: team.id,
        number: sequence.issueCounter,
        title,
        description: input.description,
        statusId: status.id,
        priority: input.priority ?? Priority.NONE,
        assigneeId: input.assigneeId,
        creatorId: actorId,
        projectId: input.projectId,
        cycleId: input.cycleId,
        dueDate: input.dueDate,
        estimate: input.estimate,
        rank,
      },
      include: issueInclude,
    });
    await tx.activity.create({ data: { workspaceId: membership.workspaceId, issueId: issue.id, actorId, type: "ISSUE_CREATED", metadata: { teamKey: team.key, number: issue.number } } });
    if (issue.assigneeId && issue.assigneeId !== actorId) {
      await tx.notification.create({ data: { workspaceId: membership.workspaceId, userId: issue.assigneeId, issueId: issue.id, type: "ISSUE_ASSIGNED", metadata: { actorId } } });
    }
    return issue;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export interface UpdateIssueInput {
  title?: string;
  description?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  statusId?: string;
  priority?: Priority;
  assigneeId?: string | null;
  projectId?: string | null;
  cycleId?: string | null;
  dueDate?: Date | null;
  estimate?: number | null;
  rank?: Prisma.Decimal;
  expectedUpdatedAt?: Date;
}

export async function updateWorkspaceIssue(workspaceSlug: string, actorId: string, issueId: string, input: UpdateIssueInput) {
  const membership = await requireWorkspaceMembership(workspaceSlug, actorId, "issues.update");
  return prisma.$transaction(async (tx) => {
    const issue = await tx.issue.findFirst({ where: { id: issueId, workspaceId: membership.workspaceId, deletedAt: null }, include: { status: true } });
    if (!issue) throw new ResourceNotFoundError("Issue not found.");
    if (membership.role === "GUEST" && issue.creatorId !== actorId && issue.assigneeId !== actorId) throw new AuthorizationError();
    if (input.expectedUpdatedAt && issue.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) throw new Error("This issue changed in another session. Refresh and retry your edit.");
    if (input.title !== undefined && (input.title.trim().length < 2 || input.title.trim().length > 180)) throw new Error("Issue titles must contain between 2 and 180 characters.");
    if (input.statusId && !(await tx.issueStatus.findFirst({ where: { id: input.statusId, teamId: issue.teamId } }))) throw new ResourceNotFoundError("Status not found for this issue's team.");
    await validateIssueRelations(tx, membership.workspaceId, input);

    const changedFields = Object.keys(input).filter((key) => key !== "expectedUpdatedAt");
    const updated = await tx.issue.update({
      where: { id: issue.id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.statusId !== undefined ? { statusId: input.statusId } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.cycleId !== undefined ? { cycleId: input.cycleId } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(input.estimate !== undefined ? { estimate: input.estimate } : {}),
        ...(input.rank !== undefined ? { rank: input.rank } : {}),
      },
      include: issueInclude,
    });
    await tx.activity.create({ data: { workspaceId: membership.workspaceId, issueId: issue.id, actorId, type: "ISSUE_UPDATED", metadata: { changedFields } } });
    return updated;
  });
}

export async function softDeleteWorkspaceIssue(workspaceSlug: string, actorId: string, issueId: string) {
  const membership = await requireWorkspaceMembership(workspaceSlug, actorId, "issues.update");
  const issue = await prisma.issue.findFirst({ where: { id: issueId, workspaceId: membership.workspaceId, deletedAt: null } });
  if (!issue) throw new ResourceNotFoundError("Issue not found.");
  if (!(["OWNER", "ADMIN"] as WorkspaceRole[]).includes(membership.role as WorkspaceRole) && issue.creatorId !== actorId) throw new AuthorizationError("Only the creator or a workspace administrator can delete this issue.");
  return prisma.$transaction([
    prisma.issue.update({ where: { id: issue.id }, data: { deletedAt: new Date() } }),
    prisma.activity.create({ data: { workspaceId: membership.workspaceId, issueId: issue.id, actorId, type: "ISSUE_DELETED", metadata: {} } }),
  ]);
}

async function validateIssueRelations(tx: Prisma.TransactionClient, workspaceId: string, input: Pick<CreateIssueInput, "assigneeId" | "projectId" | "cycleId">) {
  const checks = await Promise.all([
    input.assigneeId ? tx.workspaceMember.findFirst({ where: { workspaceId, userId: input.assigneeId } }) : true,
    input.projectId ? tx.project.findFirst({ where: { workspaceId, id: input.projectId, deletedAt: null } }) : true,
    input.cycleId ? tx.cycle.findFirst({ where: { workspaceId, id: input.cycleId } }) : true,
  ]);
  if (checks.some((result) => !result)) throw new ResourceNotFoundError("An issue property does not belong to this workspace.");
}
