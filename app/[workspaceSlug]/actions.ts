"use server";

import { Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { createWorkspaceIssue, softDeleteWorkspaceIssue, updateWorkspaceIssue } from "@/lib/db/issues";
import { toIssueDto } from "@/lib/db/workspace-bootstrap";
import type { CreateIssuePayload, DeleteIssueResult, IssueMutationResult, UpdateIssuePayload } from "@/types/issue-actions";

const createIssueSchema = z.object({
  teamId: z.string().min(1),
  title: z.string().trim().min(2, "Add a title with at least 2 characters").max(180),
  description: z.string().trim().max(20_000).optional(),
  statusId: z.string().min(1).optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]),
  assigneeId: z.string().min(1).nullable().optional(),
});

const updateIssueSchema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(20_000).optional(),
  statusId: z.string().min(1).optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  projectId: z.string().min(1).nullable().optional(),
  cycleId: z.string().min(1).nullable().optional(),
  dueDate: z.iso.date().nullable().optional(),
  estimate: z.number().int().min(0).max(100).nullable().optional(),
}).strict();

export async function createIssueAction(workspaceSlug: string, payload: CreateIssuePayload): Promise<IssueMutationResult> {
  const session = await auth();
  if (!session?.user.id) return { ok: false as const, error: "Sign in to create an issue." };
  const parsed = createIssueSchema.safeParse(payload);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the issue details." };
  try {
    const issue = await createWorkspaceIssue(workspaceSlug, session.user.id, {
      teamId: parsed.data.teamId,
      title: parsed.data.title,
      description: textDocument(parsed.data.description),
      statusId: parsed.data.statusId,
      priority: toDbPriority(parsed.data.priority),
      assigneeId: parsed.data.assigneeId,
    });
    revalidatePath(`/${workspaceSlug}`, "layout");
    return { ok: true, issue: toIssueDto(issue) };
  } catch (error) {
    return { ok: false, error: mutationMessage(error, "The issue could not be created.") };
  }
}

export async function updateIssueAction(workspaceSlug: string, issueId: string, payload: UpdateIssuePayload): Promise<IssueMutationResult> {
  const session = await auth();
  if (!session?.user.id) return { ok: false as const, error: "Sign in to update an issue." };
  const parsed = updateIssueSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the issue details." };
  try {
    const issue = await updateWorkspaceIssue(workspaceSlug, session.user.id, issueId, {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined ? { description: textDocument(parsed.data.description) } : {}),
      ...(parsed.data.statusId !== undefined ? { statusId: parsed.data.statusId } : {}),
      ...(parsed.data.priority !== undefined ? { priority: toDbPriority(parsed.data.priority) } : {}),
      ...(parsed.data.assigneeId !== undefined ? { assigneeId: parsed.data.assigneeId } : {}),
      ...(parsed.data.projectId !== undefined ? { projectId: parsed.data.projectId } : {}),
      ...(parsed.data.cycleId !== undefined ? { cycleId: parsed.data.cycleId } : {}),
      ...(parsed.data.dueDate !== undefined ? { dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00.000Z`) : null } : {}),
      ...(parsed.data.estimate !== undefined ? { estimate: parsed.data.estimate } : {}),
    });
    revalidatePath(`/${workspaceSlug}`, "layout");
    return { ok: true, issue: toIssueDto(issue) };
  } catch (error) {
    return { ok: false, error: mutationMessage(error, "The issue could not be updated.") };
  }
}

export async function deleteIssueAction(workspaceSlug: string, issueId: string): Promise<DeleteIssueResult> {
  const session = await auth();
  if (!session?.user.id) return { ok: false as const, error: "Sign in to delete an issue." };
  try {
    await softDeleteWorkspaceIssue(workspaceSlug, session.user.id, issueId);
    revalidatePath(`/${workspaceSlug}`, "layout");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mutationMessage(error, "The issue could not be deleted.") };
  }
}

function toDbPriority(value: string): Priority {
  const priorities: Record<string, Priority> = { none: Priority.NONE, low: Priority.LOW, medium: Priority.MEDIUM, high: Priority.HIGH, urgent: Priority.URGENT };
  return priorities[value] ?? Priority.NONE;
}

function textDocument(text = "") {
  return { type: "doc", content: text ? [{ type: "paragraph", content: [{ type: "text", text }] }] : [] };
}

function mutationMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
