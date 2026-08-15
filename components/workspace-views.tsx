"use client";

import { Activity, ArrowRight, Bell, CalendarDays, Check, ChevronRight, CircleDotDashed, FolderKanban, Gauge, Layers3, LockKeyhole, MailPlus, MoreHorizontal, Palette, Plus, Search, Settings2, Sparkles, UserRoundPlus, Users2 } from "lucide-react";
import { clsx } from "clsx";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Avatar, PriorityIcon, StatusIcon } from "@/components/ui/primitives";

export function DashboardView() {
  const issues = useWorkspaceStore((state) => state.issues);
  const people = useWorkspaceStore((state) => state.people);
  const currentUser = useWorkspaceStore((state) => state.currentUser);
  const selectIssue = useWorkspaceStore((state) => state.selectIssue);
  const myIssues = issues.filter((issue) => issue.assigneeId === currentUser.id && issue.status !== "done").slice(0, 5);
  const completed = issues.filter((issue) => issue.status === "done").length;
  return <section className="page-frame dashboard-page">
    <div className="welcome-row"><div><p className="eyebrow">Friday, 14 August</p><h1>Good morning, {currentUser.name.split(" ")[0]}</h1><span className="heading-note">Here’s the work that needs your attention.</span></div><div className="focus-orbit"><span style={{ "--progress": `${Math.round(completed / Math.max(1, issues.length) * 360)}deg` } as React.CSSProperties}><i /></span><div><strong>{completed}</strong><small>completed this cycle</small></div></div></div>
    <div className="dashboard-grid">
      <section className="dashboard-section my-work"><div className="section-heading"><h2>My work</h2><button>View all <ArrowRight size={14} /></button></div>{myIssues.map((issue) => <button key={issue.id} onClick={() => selectIssue(issue.id)}><StatusIcon status={issue.status} /><span><strong>{issue.title}</strong><small>{issue.identifier}</small></span><PriorityIcon priority={issue.priority} /><Avatar personId={issue.assigneeId} size="sm" /></button>)}</section>
      <section className="dashboard-section current-cycle"><div className="section-heading"><h2>Current cycle</h2><span>9 days left</span></div><div className="cycle-pulse"><div className="pulse-track"><i style={{ width: "64%" }} /></div><div><strong>Cycle 14</strong><span>32 / 50 issues</span></div></div><div className="cycle-stat-grid"><span><strong>64%</strong><small>Progress</small></span><span><strong>89</strong><small>Points</small></span><span><strong>7</strong><small>In review</small></span></div><button className="text-link">Open cycle <ChevronRight size={14} /></button></section>
      <section className="dashboard-section due-soon"><div className="section-heading"><h2>Due soon</h2><span className="warning-dot">3</span></div>{issues.filter((issue) => issue.dueDate && issue.status !== "done").slice(0, 4).map((issue) => <button key={issue.id} onClick={() => selectIssue(issue.id)}><CalendarDays size={15} /><span><strong>{issue.title}</strong><small>{issue.dueDate}</small></span><span className="issue-id">{issue.identifier}</span></button>)}</section>
      <section className="dashboard-section recent-activity"><div className="section-heading"><h2>Team activity</h2><button><MoreHorizontal size={16} /></button></div>{people.slice(1, 5).map((person, index) => <div key={person.id}><Avatar personId={person.id} size="sm" /><span><strong>{person.name}</strong> {index % 2 ? "completed" : "updated"} <b>ENG-{138 - index}</b><small>{["12m", "42m", "1h", "3h"][index]}</small></span></div>)}</section>
    </div>
  </section>;
}

export function ProjectView() {
  const issues = useWorkspaceStore((state) => state.issues);
  const projects = useWorkspaceStore((state) => state.projects);
  const people = useWorkspaceStore((state) => state.people);
  return <section className="page-frame project-page"><div className="page-heading"><div><p className="eyebrow">Portfolio · 4 active</p><h1>Projects</h1><span className="heading-note">Outcomes your teams are moving toward.</span></div><button className="button primary"><Plus size={15} />New project</button></div>
    <div className="project-overview-strip"><div><span>Portfolio health</span><strong>3 on track</strong><small>1 needs attention</small></div><div className="portfolio-bars">{projects.map((project, index) => <i key={project.id} style={{ width: `${[67, 42, 81, 56][index]}%`, background: project.color }} />)}</div><div className="project-stat"><strong>61%</strong><span>Average progress</span></div></div>
    <div className="project-table"><div className="project-table-head"><span>Project</span><span>Health</span><span>Progress</span><span>Lead</span><span>Target</span></div>{projects.map((project, index) => { const projectIssues = issues.filter((issue) => issue.projectId === project.id); const progress = Math.round(projectIssues.filter((issue) => issue.status === "done").length / Math.max(1, projectIssues.length) * 100); return <button className="project-row" key={project.id}><span className="project-identity"><i style={{ background: project.color }}><FolderKanban size={15} /></i><span><strong>{project.name}</strong><small>{project.summary}</small></span></span><span className={clsx("health-pill", project.health === "At risk" && "risk")}><i />{project.health}</span><span className="project-progress"><span><i style={{ width: `${progress}%`, background: project.color }} /></span><small>{progress}%</small></span><span className="project-lead"><Avatar personId={people[(index + 1) % people.length].id} size="sm" />{people[(index + 1) % people.length].name.split(" ")[0]}</span><span>{project.target}<ChevronRight size={14} /></span></button>; })}</div>
  </section>;
}

export function CycleView() {
  const issues = useWorkspaceStore((state) => state.issues);
  const cycles = useWorkspaceStore((state) => state.cycles);
  const statuses = useWorkspaceStore((state) => state.statuses);
  const currentCycle = cycles.find((cycle) => cycle.status === "active") ?? cycles[0];
  const active = issues.filter((issue) => issue.cycleId === currentCycle?.id);
  const counts = statuses.map((status) => ({ status, count: active.filter((issue) => issue.status === status.id).length }));
  const total = Math.max(1, active.length);
  return <section className="page-frame cycle-page"><div className="page-heading"><div><p className="eyebrow">Engineering cadence</p><h1>Cycles</h1><span className="heading-note">Keep the team focused on a clear window of work.</span></div><button className="button primary"><Plus size={15} />Plan cycle</button></div>
    <div className="cycle-hero"><div className="cycle-hero-title"><span className="cycle-icon"><Layers3 size={19} /></span><div><span>Current cycle</span><h2>{currentCycle?.name ?? "No active cycle"}</h2><small>{currentCycle?.range ?? "Plan the next cycle"}</small></div></div><div className="cycle-progress-large"><strong>{Math.round(active.filter((issue) => issue.status === "done").length / total * 100)}%</strong><span><i style={{ width: `${Math.round(active.filter((issue) => issue.status === "done").length / total * 100)}%` }} /></span><small>{active.filter((issue) => issue.status === "done").length} of {active.length} completed</small></div></div>
    <div className="cycle-layout"><section className="cycle-chart"><div className="section-heading"><h2>Scope progress</h2><span>By issue status</span></div><div className="status-distribution">{counts.map(({ status, count }) => <i key={status.id} style={{ width: `${count / total * 100}%`, background: status.color }} title={`${status.name}: ${count}`} />)}</div><div className="status-legend">{counts.map(({ status, count }) => <span key={status.id}><i style={{ background: status.color }} />{status.name}<strong>{count}</strong></span>)}</div><div className="burndown-placeholder"><div className="chart-grid" /><svg viewBox="0 0 600 160" preserveAspectRatio="none"><path d="M0 22 C 80 30, 90 38, 145 42 S 210 65, 270 69 S 330 90, 385 99 S 470 118, 600 146" fill="none" stroke="var(--accent)" strokeWidth="3" /><path d="M0 22 L600 155" fill="none" stroke="var(--line-strong)" strokeDasharray="5 7" /></svg><span>Scope remaining</span></div></section><aside className="cycle-sidebar"><div><h3>Cycle summary</h3><p><span>Completed issues</span><strong>{active.filter((issue) => issue.status === "done").length} / {active.length}</strong></p><p><span>Unestimated</span><strong>{active.filter((issue) => issue.estimate === null).length}</strong></p></div><div><h3>Other cycles</h3>{cycles.filter((cycle) => cycle.id !== currentCycle?.id).map((cycle) => <button key={cycle.id}><span><strong>{cycle.name}</strong><small>{cycle.range}</small></span><ChevronRight size={14} /></button>)}</div></aside></div>
  </section>;
}

export function InboxView() {
  const notifications = useWorkspaceStore((state) => state.notifications);
  const markAllRead = useWorkspaceStore((state) => state.markAllRead);
  const markRead = useWorkspaceStore((state) => state.markRead);
  const unread = notifications.filter((item) => item.unread).length;
  const iconMap = { assignment: UserRoundPlus, mention: Sparkles, comment: Bell, update: Activity };
  return <section className="page-frame inbox-page"><div className="page-heading"><div><p className="eyebrow">Notification centre</p><h1>Inbox <span>{unread}</span></h1><span className="heading-note">Updates that need a decision or response.</span></div><button className="button subtle" onClick={markAllRead}><Check size={14} />Mark all read</button></div><div className="inbox-toolbar"><button className="active">All</button><button>Unread <span>{unread}</span></button><button>Archived</button><div /><label><Search size={14} /><input placeholder="Search inbox" /></label></div><div className="notification-list">{notifications.map((item) => { const Icon = iconMap[item.kind]; return <button key={item.id} className={item.unread ? "unread" : ""} onClick={() => markRead(item.id)}><span className="notification-icon"><Icon size={16} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{item.time}</time>{item.unread && <i />}</button>; })}</div></section>;
}

const settingsNavigation = [
  { label: "Workspace", route: "settings", icon: Settings2 }, { label: "Members", route: "settings/members", icon: Users2 }, { label: "Teams", route: "settings/teams", icon: Gauge }, { label: "Labels", route: "settings/labels", icon: Palette }, { label: "Notifications", route: "settings/notifications", icon: Bell }, { label: "Security", route: "settings/security", icon: LockKeyhole },
];

export function SettingsView({ route }: { route: string }) {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const selected = settingsNavigation.find((item) => item.route === route) ?? settingsNavigation[0];
  return <section className="settings-page"><aside><p>Settings</p>{settingsNavigation.map((item) => { const Icon = item.icon; return <button key={item.route} className={selected.route === item.route ? "active" : ""}><Icon size={15} />{item.label}</button>; })}</aside><div className="settings-content"><div className="settings-heading"><p className="eyebrow">Workspace administration</p><h1>{selected.label}</h1><span>Manage how {workspace.name} works together.</span></div>{selected.label === "Members" ? <MembersSettings /> : <WorkspaceSettings />}</div></section>;
}

function WorkspaceSettings() {
  const workspace = useWorkspaceStore((state) => state.workspace);
  return <><section className="settings-card"><div><h2>Workspace profile</h2><p>Shown to everyone who belongs to this workspace.</p></div><div className="workspace-profile-form"><span className="workspace-mark large"><span>{workspace.icon}</span></span><label><span>Workspace name</span><input defaultValue={workspace.name} /></label><label><span>Workspace URL</span><div className="prefixed-input"><small>orbit.work/</small><input defaultValue={workspace.slug} /></div></label><button className="button primary">Save changes</button></div></section><section className="settings-card"><div><h2>Preferences</h2><p>Defaults for new members and teams.</p></div><div className="settings-toggle-list"><label><span><strong>Compact interface</strong><small>Fit more issues on screen.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Auto-assign created issues</strong><small>Assign new issues to their creator.</small></span><input type="checkbox" /></label></div></section></>;
}

function MembersSettings() {
  const people = useWorkspaceStore((state) => state.people);
  return <section className="settings-card members-settings"><div className="members-heading"><div><h2>Members</h2><p>{people.length} people have access to this workspace.</p></div><button className="button primary"><MailPlus size={15} />Invite member</button></div><label className="member-search"><Search size={15} /><input placeholder="Search members" /></label><div className="members-list">{people.map((person, index) => <div key={person.id}><Avatar personId={person.id} /><span><strong>{person.name}</strong><small>{person.role}</small></span><em>{index === 0 ? "Owner" : index < 3 ? "Admin" : "Member"}</em><button><MoreHorizontal size={16} /></button></div>)}</div></section>;
}

export function GenericView({ title }: { title: string }) {
  return <section className="page-frame"><div className="page-heading"><div><p className="eyebrow">Workspace view</p><h1 className="capitalize">{title}</h1><span className="heading-note">This view is ready for your team’s saved filters.</span></div></div><div className="empty-state"><div className="empty-orbit"><CircleDotDashed size={22} /></div><h3>No saved views yet</h3><p>Combine filters, grouping, and display options into a reusable workspace view.</p><button className="button primary"><Plus size={14} />Create view</button></div></section>;
}
