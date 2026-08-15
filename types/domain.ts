export type StatusKey = "backlog" | "todo" | "progress" | "review" | "done";
export type PriorityKey = "none" | "low" | "medium" | "high" | "urgent";

export interface Person {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
}

export interface Status {
  id: StatusKey;
  dbId?: string;
  name: string;
  color: string;
  category: "backlog" | "unstarted" | "started" | "completed";
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  color: string;
  target: string;
  health: "On track" | "At risk" | "Off track";
}

export interface Cycle {
  id: string;
  name: string;
  range: string;
  status: "active" | "upcoming" | "completed";
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  status: StatusKey;
  priority: PriorityKey;
  assigneeId: string | null;
  projectId: string | null;
  cycleId: string | null;
  labels: string[];
  estimate: number | null;
  dueDate: string | null;
  rank: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: "assignment" | "mention" | "comment" | "update";
  unread: boolean;
  issueId?: string;
}

export interface WorkspaceBootstrap {
  workspace: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  team: {
    id: string;
    name: string;
    key: string;
    color: string;
  };
  currentUser: {
    id: string;
    name: string;
    initials: string;
  };
  people: Person[];
  statuses: Status[];
  labels: Label[];
  projects: Project[];
  cycles: Cycle[];
  issues: Issue[];
  notifications: NotificationItem[];
}
