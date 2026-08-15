"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, Bell, Box, ChevronDown, CircleDotDashed, Gauge, Inbox, Layers3, ListTodo, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings2, Sparkles, SquareStack } from "lucide-react";
import { clsx } from "clsx";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Kbd } from "@/components/ui/primitives";
import { logoutAction } from "@/lib/auth/actions";

const mainItems = [
  { label: "Dashboard", route: "dashboard", icon: Gauge },
  { label: "Inbox", route: "inbox", icon: Inbox, badge: "3" },
  { label: "My issues", route: "my-issues", icon: ListTodo },
];

const workspaceItems = [
  { label: "Issues", route: "issues", icon: CircleDotDashed },
  { label: "Projects", route: "projects", icon: SquareStack },
  { label: "Cycles", route: "cycles", icon: Layers3 },
  { label: "Views", route: "views", icon: Archive },
];

export function Sidebar({ workspaceSlug, route }: { workspaceSlug: string; route: string }) {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const team = useWorkspaceStore((state) => state.team);
  const projects = useWorkspaceStore((state) => state.projects);
  const currentUser = useWorkspaceStore((state) => state.currentUser);
  const unreadNotifications = useWorkspaceStore((state) => state.notifications.filter((item) => item.unread).length);
  const collapsed = useWorkspaceStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar);
  const setCreateOpen = useWorkspaceStore((state) => state.setCreateOpen);
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const href = (path: string) => `/${workspaceSlug}/${path}`;

  return (
    <aside className="sidebar" aria-label="Workspace navigation">
      <div className="workspace-switcher">
        <span className="workspace-mark"><span>{workspace.icon}</span></span>
        <span className="workspace-name">{workspace.name}</span><ChevronDown className="workspace-chevron" size={14} />
      </div>
      <button className="quick-create" onClick={() => setCreateOpen(true)}>
        <Plus size={15} /><span>New issue</span><Kbd>C</Kbd>
      </button>
      <button className="sidebar-search" onClick={() => setCommandOpen(true)}>
        <Search size={15} /><span>Search</span><Kbd>⌘ K</Kbd>
      </button>
      <nav className="sidebar-nav">
        {mainItems.map((item) => <SidebarLink key={item.route} item={{ ...item, ...(item.route === "inbox" ? { badge: unreadNotifications ? String(unreadNotifications) : undefined } : {}) }} active={route === item.route} href={href(item.route)} />)}
        <div className="nav-section-label"><span>Workspace</span><button aria-label="Add workspace view"><Plus size={13} /></button></div>
        {workspaceItems.map((item) => <SidebarLink key={item.route} item={item} active={route === item.route || route.startsWith(`${item.route}/`)} href={href(item.route)} />)}
        <>
            <button className="nav-section-label section-toggle" onClick={() => setTeamsOpen((value) => !value)}><span>Teams</span><ChevronDown size={13} className={teamsOpen ? "" : "rotated"} /></button>
            {teamsOpen && <div className="teams-list">
              <SidebarLink item={{ label: team.name, route: `team/${team.key.toLowerCase()}`, icon: Box }} active={route === `team/${team.key.toLowerCase()}`} href={href(`team/${team.key.toLowerCase()}`)} dot={team.color} />
            </div>}
            <div className="nav-section-label project-label"><span>Projects</span><button aria-label="Add project"><Plus size={13} /></button></div>
            <div className="sidebar-projects">
              {projects.slice(0, 3).map((project) => <Link href={href(`project/${project.id}`)} key={project.id}><span style={{ background: project.color }} />{project.name}</Link>)}
            </div>
        </>
      </nav>
      <div className="sidebar-footer">
        <Link href={href("settings")} className={clsx("nav-item", route.startsWith("settings") && "active")} title="Settings"><Settings2 size={16} /><span>Settings</span></Link>
        <button className="nav-item" title="Notifications"><Bell size={16} /><span>Notifications</span></button>
        <button className="nav-item collapse-control" onClick={toggleSidebar} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}<span>Collapse</span></button>
        <form action={logoutAction} className="sidebar-user"><span className="avatar avatar-md" style={{ "--avatar": "#6d5ce8" } as React.CSSProperties}>{currentUser.initials}</span><span><strong>{currentUser.name.split(" ")[0]}</strong><small>Available</small></span><button type="submit" title="Sign out" aria-label="Sign out"><Sparkles size={14} /></button></form>
      </div>
    </aside>
  );
}

type NavItem = { label: string; route: string; icon: React.ComponentType<{ size?: number }>; badge?: string };

function SidebarLink({ item, active, href, dot }: { item: NavItem; active: boolean; href: string; dot?: string }) {
  const Icon = item.icon;
  return <Link href={href} className={clsx("nav-item", active && "active")} title={item.label}><span className="nav-icon">{dot ? <span className="team-dot" style={{ background: dot }} /> : <Icon size={16} />}</span><span>{item.label}</span>{item.badge && <em>{item.badge}</em>}</Link>;
}
