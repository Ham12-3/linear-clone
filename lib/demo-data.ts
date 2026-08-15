import type { Cycle, Issue, Label, NotificationItem, Person, Project, Status } from "@/types/domain";

export const people: Person[] = [
  { id: "u1", name: "Abdulhamid Sonaike", initials: "AS", color: "#6d5ce8", role: "Product engineer" },
  { id: "u2", name: "Maya Chen", initials: "MC", color: "#1d9a72", role: "Product lead" },
  { id: "u3", name: "Jon Bell", initials: "JB", color: "#d06c42", role: "Staff engineer" },
  { id: "u4", name: "Priya Nair", initials: "PN", color: "#c24f73", role: "Designer" },
  { id: "u5", name: "Noah Williams", initials: "NW", color: "#3a7fca", role: "Mobile engineer" },
  { id: "u6", name: "Sofia Rossi", initials: "SR", color: "#8b6b32", role: "Data engineer" },
  { id: "u7", name: "Ibrahim Diallo", initials: "ID", color: "#587b46", role: "Infrastructure" },
  { id: "u8", name: "Elena Martín", initials: "EM", color: "#7f5ab5", role: "QA engineer" },
];

export const statuses: Status[] = [
  { id: "backlog", name: "Backlog", color: "#8c9099", category: "backlog" },
  { id: "todo", name: "Todo", color: "#727783", category: "unstarted" },
  { id: "progress", name: "In progress", color: "#6659d9", category: "started" },
  { id: "review", name: "In review", color: "#d38a32", category: "started" },
  { id: "done", name: "Done", color: "#2b9a73", category: "completed" },
];

export const labels: Label[] = [
  { id: "backend", name: "Backend", color: "#7a67d8" },
  { id: "frontend", name: "Frontend", color: "#3188c7" },
  { id: "design", name: "Design", color: "#d55f9a" },
  { id: "bug", name: "Bug", color: "#d95b59" },
  { id: "performance", name: "Performance", color: "#c98a2f" },
  { id: "security", name: "Security", color: "#4f8864" },
];

export const projects: Project[] = [
  { id: "search", name: "Search V2", summary: "Make finding work feel instantaneous.", color: "#6d5ce8", target: "30 Sep", health: "On track" },
  { id: "mobile", name: "Mobile application", summary: "A focused companion for work on the move.", color: "#258f7b", target: "18 Oct", health: "At risk" },
  { id: "billing", name: "Billing platform", summary: "Reliable plans, invoices and usage controls.", color: "#d07a43", target: "07 Nov", health: "On track" },
  { id: "design-system", name: "Design system", summary: "One clear visual language across every surface.", color: "#c05d8a", target: "22 Sep", health: "On track" },
];

export const cycles: Cycle[] = [
  { id: "c14", name: "Cycle 14", range: "12 Aug – 26 Aug", status: "active" },
  { id: "c15", name: "Cycle 15", range: "27 Aug – 10 Sep", status: "upcoming" },
  { id: "c13", name: "Cycle 13", range: "29 Jul – 11 Aug", status: "completed" },
];

const titles = [
  "Reduce global search time below 100ms", "Add fuzzy matching for issue identifiers", "Index comment bodies for workspace search",
  "Design empty states for new workspaces", "Fix stale assignee after rapid updates", "Add keyboard navigation to issue rows",
  "Create billing usage breakdown", "Improve mobile navigation hierarchy", "Add passkey-ready session architecture",
  "Prevent duplicate invitation acceptance", "Virtualize issue list above 500 rows", "Ship project health update composer",
  "Add command menu recency ranking", "Clarify overdue issue treatment", "Instrument workspace switch latency",
  "Support drag cancellation on Escape", "Add cycle rollover confirmation", "Build label management settings",
  "Create reusable member picker", "Tighten API token scope model", "Add CSV issue export",
  "Improve board column keyboard access", "Create notification digest preferences", "Add comment edit history",
  "Handle deleted assignees gracefully", "Create project milestone timeline", "Add query syntax hints to search",
  "Audit focus order in side peek", "Improve issue creation validation", "Add webhook delivery retry policy",
  "Migrate avatars to object storage", "Create mobile issue detail sheet", "Add team capacity indicator",
  "Document fractional ordering strategy", "Fix date picker timezone boundary", "Add workspace audit log filters",
  "Create saved view sharing controls", "Show active filters in URL", "Add skeleton for slow project queries",
  "Improve sidebar collapse transition", "Create inbox bulk archive action", "Add optimistic comment reactions",
  "Validate rich text link protocols", "Create security event notifications", "Add project resource links",
  "Improve status picker scanability", "Add issue duplicate action", "Create cycle velocity sparkline",
  "Support compact table preferences", "Add accessible shortcut reference",
];

const descriptions = [
  "The current path is correct but leaves too much work on the client. Move scoring closer to the query and keep the interaction instant.",
  "Create a durable implementation with clear loading, empty and failure states. Preserve keyboard focus throughout the flow.",
  "This is a focused quality pass. Keep the change small, measurable and straightforward to review.",
];

export const initialIssues: Issue[] = titles.map((title, index) => {
  const statusOrder: Issue["status"][] = ["progress", "todo", "done", "backlog", "review"];
  const priorityOrder: Issue["priority"][] = ["high", "medium", "low", "urgent", "none"];
  const projectIds = projects.map((project) => project.id);
  const labelIds = labels.map((label) => label.id);
  const status = statusOrder[index % statusOrder.length];
  return {
    id: `issue-${index + 1}`,
    identifier: `ENG-${142 - index}`,
    title,
    description: descriptions[index % descriptions.length],
    status,
    priority: priorityOrder[index % priorityOrder.length],
    assigneeId: index % 7 === 0 ? null : people[index % people.length].id,
    projectId: index % 6 === 0 ? null : projectIds[index % projectIds.length],
    cycleId: index % 4 === 0 ? null : index % 5 === 0 ? "c15" : "c14",
    labels: index % 3 === 0 ? [labelIds[index % labelIds.length], labelIds[(index + 2) % labelIds.length]] : [labelIds[index % labelIds.length]],
    estimate: index % 4 === 0 ? null : [1, 2, 3, 5, 8][index % 5],
    dueDate: index % 5 === 0 ? "2026-08-18" : index % 3 === 0 ? "2026-08-28" : null,
    rank: (index + 1) * 1000,
    comments: index % 5,
    createdAt: `2026-08-${String(Math.max(1, 14 - (index % 12))).padStart(2, "0")}`,
    updatedAt: index < 7 ? "Today" : index < 18 ? "Yesterday" : `${2 + (index % 6)}d ago`,
  };
});

export const initialNotifications: NotificationItem[] = [
  { id: "n1", title: "Maya assigned you ENG-142", detail: "Reduce global search time below 100ms", time: "8m", kind: "assignment", unread: true, issueId: "issue-1" },
  { id: "n2", title: "Priya mentioned you", detail: "Can you check the keyboard flow before we ship?", time: "32m", kind: "mention", unread: true, issueId: "issue-6" },
  { id: "n3", title: "New comment on ENG-134", detail: "The session architecture is ready for review.", time: "2h", kind: "comment", unread: true, issueId: "issue-9" },
  { id: "n4", title: "Search V2 is on track", detail: "Maya posted a project update.", time: "Yesterday", kind: "update", unread: false },
];
