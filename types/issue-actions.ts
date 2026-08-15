import type { Issue, PriorityKey } from "@/types/domain";

export interface CreateIssuePayload {
  teamId: string;
  title: string;
  description?: string;
  statusId?: string;
  priority: PriorityKey;
  assigneeId?: string | null;
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  statusId?: string;
  priority?: PriorityKey;
  assigneeId?: string | null;
  projectId?: string | null;
  cycleId?: string | null;
  dueDate?: string | null;
  estimate?: number | null;
}

export type IssueMutationResult =
  | { ok: true; issue: Issue }
  | { ok: false; error: string };

export type DeleteIssueResult = { ok: true } | { ok: false; error: string };
