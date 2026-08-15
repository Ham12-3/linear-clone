"use client";

import { AlertCircle, Check, Circle, CircleDashed, CircleDot, Gauge, MessageSquare, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { clsx } from "clsx";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { PriorityKey, StatusKey } from "@/types/domain";

export function Avatar({ personId, size = "md" }: { personId: string | null; size?: "sm" | "md" | "lg" }) {
  const people = useWorkspaceStore((state) => state.people);
  const person = people.find((item) => item.id === personId);
  if (!person) return <span className={clsx("avatar avatar-empty", `avatar-${size}`)}>?</span>;
  return <span className={clsx("avatar", `avatar-${size}`)} style={{ "--avatar": person.color } as React.CSSProperties} title={person.name}>{person.initials}</span>;
}

export function StatusIcon({ status, size = 15 }: { status: StatusKey; size?: number }) {
  const statuses = useWorkspaceStore((state) => state.statuses);
  const config = statuses.find((item) => item.id === status);
  const color = config?.color ?? "#8c9099";
  const props = { size, strokeWidth: 2, style: { color } };
  if (status === "done") return <Check {...props} className="status-complete" />;
  if (status === "progress") return <CircleDot {...props} />;
  if (status === "review") return <CircleDashed {...props} />;
  if (status === "todo") return <Circle {...props} />;
  return <CircleDashed {...props} />;
}

export function PriorityIcon({ priority, size = 15 }: { priority: PriorityKey; size?: number }) {
  const props = { size, strokeWidth: 2 };
  if (priority === "urgent") return <AlertCircle {...props} className="priority-urgent" />;
  if (priority === "high") return <SignalHigh {...props} className="priority-high" />;
  if (priority === "medium") return <SignalMedium {...props} className="priority-medium" />;
  if (priority === "low") return <SignalLow {...props} className="priority-low" />;
  return <Gauge {...props} className="priority-none" />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd>{children}</kbd>;
}

export function CommentCount({ count }: { count: number }) {
  if (!count) return null;
  return <span className="comment-count"><MessageSquare size={13} />{count}</span>;
}
