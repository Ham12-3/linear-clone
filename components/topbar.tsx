"use client";

import { Bell, ChevronDown, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Kbd } from "@/components/ui/primitives";

const routeNames: Record<string, string> = {
  dashboard: "Home",
  inbox: "Inbox",
  "my-issues": "My issues",
  issues: "All issues",
  projects: "Projects",
  cycles: "Cycles",
  settings: "Settings",
};

export function Topbar({ route }: { workspaceSlug: string; route: string }) {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const team = useWorkspaceStore((state) => state.team);
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar);
  const setCreateOpen = useWorkspaceStore((state) => state.setCreateOpen);
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);
  const notifications = useWorkspaceStore((state) => state.notifications);
  const label = route.startsWith("project/") ? "Project overview" : route.startsWith("team/") ? `${team.name} team` : routeNames[route.split("/")[0]] ?? "Workspace";
  const unread = notifications.filter((item) => item.unread).length;
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="mobile-menu" onClick={toggleSidebar} aria-label="Toggle navigation"><Menu size={18} /></button>
        <span>{workspace.name}</span><span className="crumb-divider">/</span><strong>{label}</strong><ChevronDown size={13} />
      </div>
      <div className="topbar-actions">
        <button className="top-search" onClick={() => setCommandOpen(true)}><Search size={14} /><span>Jump to…</span><Kbd>⌘K</Kbd></button>
        <button className="icon-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={`Use ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button>
        <button className="icon-button notification-button" aria-label={`${unread} unread notifications`}><Bell size={16} />{unread > 0 && <span />}</button>
        <button className="button primary compact" onClick={() => setCreateOpen(true)}><Plus size={15} />Issue</button>
      </div>
    </header>
  );
}
