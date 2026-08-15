import "server-only";

import { CycleStatus, NotificationState, Prisma, Priority, ProjectStatus, StatusCategory } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { listWorkspaceIssues } from "@/lib/db/issues";
import { requireWorkspaceMembership } from "@/lib/db/workspaces";
import type { Cycle, Issue, Label, NotificationItem, Person, PriorityKey, Project, Status, StatusKey, WorkspaceBootstrap } from "@/types/domain";

type WorkspaceIssueRecord = Awaited<ReturnType<typeof listWorkspaceIssues>>["issues"][number];

export async function getWorkspaceBootstrap(workspaceSlug: string, userId: string): Promise<WorkspaceBootstrap> {
  const membership = await requireWorkspaceMembership(workspaceSlug, userId);
  const [workspace, issuePage] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: membership.workspaceId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, jobTitle: true } } },
          orderBy: { joinedAt: "asc" },
        },
        teams: { include: { statuses: { orderBy: { position: "asc" } } }, orderBy: { createdAt: "asc" } },
        projects: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
        cycles: { orderBy: { startsAt: "desc" } },
        labels: { orderBy: { name: "asc" } },
        notifications: {
          where: { userId, state: { not: NotificationState.ARCHIVED } },
          include: { issue: { include: { team: { select: { key: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
    listWorkspaceIssues(workspaceSlug, userId, { take: 100 }),
  ]);
  if (!workspace) throw new Error("Workspace not found.");
  const team = workspace.teams[0];
  if (!team) throw new Error("This workspace does not have a team yet.");

  const people = workspace.members.map((item, index): Person => ({
    id: item.user.id,
    name: item.user.name,
    initials: initials(item.user.name),
    color: avatarColor(item.user.id, index),
    role: item.user.jobTitle ?? titleCase(item.role),
  }));
  const statuses = team.statuses.flatMap((item): Status[] => {
    const id = statusKey(item.name, item.category);
    return id ? [{ id, dbId: item.id, name: item.name, color: item.color, category: statusCategory(item.category) }] : [];
  });

  return {
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug, icon: workspace.icon ?? initials(workspace.name).slice(0, 1) },
    team: { id: team.id, name: team.name, key: team.key, color: team.color },
    currentUser: { id: membership.user.id, name: membership.user.name, initials: initials(membership.user.name) },
    people,
    statuses,
    labels: workspace.labels.map((item): Label => ({ id: item.id, name: item.name, color: item.color })),
    projects: workspace.projects.map(toProjectDto),
    cycles: workspace.cycles.map(toCycleDto),
    issues: issuePage.issues.map(toIssueDto),
    notifications: workspace.notifications.map((item): NotificationItem => {
      const identifier = item.issue ? `${item.issue.team.key}-${item.issue.number}` : null;
      const kind = notificationKind(item.type);
      return {
        id: item.id,
        title: kind === "assignment" && identifier ? `You were assigned ${identifier}` : notificationTitle(kind, identifier),
        detail: item.issue?.title ?? "A workspace update is ready to review.",
        time: relativeTime(item.createdAt),
        kind,
        unread: item.state === NotificationState.UNREAD,
        ...(item.issueId ? { issueId: item.issueId } : {}),
      };
    }),
  };
}

export function toIssueDto(issue: WorkspaceIssueRecord): Issue {
  return {
    id: issue.id,
    identifier: `${issue.team.key}-${issue.number}`,
    title: issue.title,
    description: plainText(issue.description) || "Add context, acceptance criteria, or links for this issue.",
    status: statusKey(issue.status.name, issue.status.category) ?? "backlog",
    priority: priorityKey(issue.priority),
    assigneeId: issue.assigneeId,
    projectId: issue.projectId,
    cycleId: issue.cycleId,
    labels: issue.labels.map((item) => item.labelId),
    estimate: issue.estimate,
    dueDate: issue.dueDate?.toISOString().slice(0, 10) ?? null,
    rank: Number(issue.rank),
    comments: issue._count.comments,
    createdAt: issue.createdAt.toISOString().slice(0, 10),
    updatedAt: relativeTime(issue.updatedAt),
  };
}

function toProjectDto(project: { id: string; name: string; summary: string | null; color: string; status: ProjectStatus; targetDate: Date | null }): Project {
  return {
    id: project.id,
    name: project.name,
    summary: project.summary ?? "No project summary yet.",
    color: project.color,
    target: project.targetDate ? project.targetDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "No date",
    health: project.status === ProjectStatus.PAUSED ? "At risk" : project.status === ProjectStatus.CANCELLED ? "Off track" : "On track",
  };
}

function toCycleDto(cycle: { id: string; name: string; startsAt: Date; endsAt: Date; status: CycleStatus }): Cycle {
  const format = (date: Date) => date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  return { id: cycle.id, name: cycle.name, range: `${format(cycle.startsAt)} – ${format(cycle.endsAt)}`, status: cycle.status.toLowerCase() as Cycle["status"] };
}

function statusKey(name: string, category: StatusCategory): StatusKey | null {
  const normalized = name.toLowerCase();
  if (category === StatusCategory.CANCELLED) return null;
  if (category === StatusCategory.COMPLETED) return "done";
  if (category === StatusCategory.BACKLOG) return "backlog";
  if (normalized.includes("review")) return "review";
  if (category === StatusCategory.STARTED) return "progress";
  return "todo";
}

function statusCategory(category: StatusCategory): Status["category"] {
  if (category === StatusCategory.BACKLOG) return "backlog";
  if (category === StatusCategory.UNSTARTED) return "unstarted";
  if (category === StatusCategory.COMPLETED) return "completed";
  return "started";
}

function priorityKey(priority: Priority): PriorityKey {
  return priority.toLowerCase() as PriorityKey;
}

function notificationKind(type: string): NotificationItem["kind"] {
  if (type.includes("ASSIGN")) return "assignment";
  if (type.includes("MENTION")) return "mention";
  if (type.includes("COMMENT")) return "comment";
  return "update";
}

function notificationTitle(kind: NotificationItem["kind"], identifier: string | null): string {
  const subject = identifier ?? "your workspace";
  if (kind === "mention") return `You were mentioned in ${subject}`;
  if (kind === "comment") return `New comment on ${subject}`;
  return `${subject} was updated`;
}

function relativeTime(date: Date): string {
  const difference = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 8) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function plainText(value: Prisma.JsonValue | null): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(plainText).filter(Boolean).join("\n");
  if (value && typeof value === "object") {
    const object = value as Record<string, Prisma.JsonValue>;
    if (typeof object.text === "string") return object.text;
    if (object.content) return plainText(object.content);
  }
  return "";
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function avatarColor(id: string, index: number): string {
  const colors = ["#6d5ce8", "#1d9a72", "#d06c42", "#c24f73", "#3a7fca", "#8b6b32", "#587b46", "#7f5ab5"];
  const total = [...id].reduce((value, character) => value + character.charCodeAt(0), index);
  return colors[total % colors.length];
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/^\w/, (character) => character.toUpperCase());
}
