"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cycles, initialIssues, initialNotifications, labels, people, projects, statuses } from "@/lib/demo-data";
import type { Cycle, Issue, Label, NotificationItem, Person, Project, Status, WorkspaceBootstrap } from "@/types/domain";

type IssuePatch = Partial<Omit<Issue, "id" | "identifier">>;

interface WorkspaceState {
  hydratedWorkspaceId: string | null;
  workspace: WorkspaceBootstrap["workspace"];
  team: WorkspaceBootstrap["team"];
  currentUser: WorkspaceBootstrap["currentUser"];
  people: Person[];
  statuses: Status[];
  labels: Label[];
  projects: Project[];
  cycles: Cycle[];
  issues: Issue[];
  notifications: NotificationItem[];
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  createOpen: boolean;
  commandOpen: boolean;
  shortcutOpen: boolean;
  selectedIssueId: string | null;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setCreateOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setShortcutOpen: (open: boolean) => void;
  selectIssue: (id: string | null) => void;
  hydrateWorkspace: (data: WorkspaceBootstrap) => void;
  addIssue: (issue: Issue) => void;
  updateIssue: (id: string, patch: IssuePatch) => void;
  deleteIssue: (id: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      hydratedWorkspaceId: null,
      workspace: { id: "demo", name: "Orbit Labs", slug: "acme", icon: "O" },
      team: { id: "demo-team", name: "Engineering", key: "ENG", color: "#6d5ce8" },
      currentUser: { id: "u1", name: "Abdulhamid Sonaike", initials: "AS" },
      people,
      statuses,
      labels,
      projects,
      cycles,
      issues: initialIssues,
      notifications: initialNotifications,
      theme: "light",
      sidebarCollapsed: false,
      createOpen: false,
      commandOpen: false,
      shortcutOpen: false,
      selectedIssueId: null,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCreateOpen: (createOpen) => set({ createOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setShortcutOpen: (shortcutOpen) => set({ shortcutOpen }),
      selectIssue: (selectedIssueId) => set({ selectedIssueId }),
      hydrateWorkspace: (data) => set((state) => ({
        ...data,
        hydratedWorkspaceId: data.workspace.id,
        selectedIssueId: state.selectedIssueId && data.issues.some((issue) => issue.id === state.selectedIssueId) ? state.selectedIssueId : null,
      })),
      addIssue: (issue) => set((state) => ({ issues: [issue, ...state.issues], selectedIssueId: issue.id, createOpen: false })),
      updateIssue: (id, patch) => set((state) => ({
        issues: state.issues.map((issue) => issue.id === id ? { ...issue, ...patch, updatedAt: "Now" } : issue),
      })),
      deleteIssue: (id) => set((state) => ({ issues: state.issues.filter((issue) => issue.id !== id), selectedIssueId: null })),
      markAllRead: () => set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, unread: false })) })),
      markRead: (id) => set((state) => ({ notifications: state.notifications.map((item) => item.id === id ? { ...item, unread: false } : item) })),
    }),
    {
      name: "orbit-workspace-v1",
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
