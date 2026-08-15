"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, CircleDotDashed, Command, Layers3, ListTodo, Moon, Plus, Search, Settings2, SquareStack, Sun, X } from "lucide-react";
import { issueInputSchema } from "@/lib/validation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { PriorityKey, StatusKey } from "@/types/domain";
import { Avatar, Kbd, PriorityIcon, StatusIcon } from "@/components/ui/primitives";
import { createIssueAction } from "@/app/[workspaceSlug]/actions";

export function CreateIssueDialog() {
  const open = useWorkspaceStore((state) => state.createOpen);
  const setOpen = useWorkspaceStore((state) => state.setCreateOpen);
  const addIssue = useWorkspaceStore((state) => state.addIssue);
  const people = useWorkspaceStore((state) => state.people);
  const statuses = useWorkspaceStore((state) => state.statuses);
  const team = useWorkspaceStore((state) => state.team);
  const workspaceSlug = useWorkspaceStore((state) => state.workspace.slug);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<StatusKey>("todo");
  const [priority, setPriority] = useState<PriorityKey>("none");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  if (!open) return null;
  const submit = () => {
    const result = issueInputSchema.safeParse({ title, team: team.key, status, priority });
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Check the issue details"); return; }
    const statusId = statuses.find((item) => item.id === status)?.dbId;
    if (!statusId) { setError("This issue status is not available."); return; }
    startTransition(async () => {
      const created = await createIssueAction(workspaceSlug, { teamId: team.id, title: result.data.title, description, statusId, priority, assigneeId: assigneeId || null });
      if (!created.ok) { setError(created.error); return; }
      addIssue(created.issue);
      setTitle(""); setDescription(""); setStatus("todo"); setPriority("none"); setAssigneeId(""); setError("");
    });
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
    <div className="create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-title">
      <div className="dialog-header"><div><span className="panel-team-mark">ENG</span><strong id="create-title">Create issue</strong></div><button onClick={() => setOpen(false)} aria-label="Close"><X size={17} /></button></div>
      <div className="create-body">
        <input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit(); }} placeholder="Issue title" aria-label="Issue title" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Add a description…" aria-label="Issue description" />
        {error && <p className="form-error">{error}</p>}
      </div>
      <div className="create-properties">
        <label><StatusIcon status={status} /><select value={status} onChange={(event) => setStatus(event.target.value as StatusKey)}>{statuses.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label><PriorityIcon priority={priority} /><select value={priority} onChange={(event) => setPriority(event.target.value as PriorityKey)}><option value="none">Priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        <label><Avatar personId={assigneeId || null} size="sm" /><select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}><option value="">Assignee</option>{people.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label>
      </div>
      <div className="dialog-footer"><span>Creates in <strong>{team.name}</strong></span><div><Kbd>⌘ Enter</Kbd><button className="button primary" disabled={pending} onClick={submit}>{pending ? "Creating…" : "Create issue"}</button></div></div>
    </div>
  </div>;
}

export function CommandMenu({ workspaceSlug }: { workspaceSlug: string }) {
  const open = useWorkspaceStore((state) => state.commandOpen);
  const setOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const setCreateOpen = useWorkspaceStore((state) => state.setCreateOpen);
  const setTheme = useWorkspaceStore((state) => state.setTheme);
  const theme = useWorkspaceStore((state) => state.theme);
  const issues = useWorkspaceStore((state) => state.issues);
  const selectIssue = useWorkspaceStore((state) => state.selectIssue);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const commands = [
    { label: "Create issue", detail: "C", icon: Plus, action: () => setCreateOpen(true) },
    { label: "Go to issues", detail: "G then I", icon: CircleDotDashed, path: "issues" },
    { label: "Go to my issues", detail: "G then M", icon: ListTodo, path: "my-issues" },
    { label: "Go to projects", detail: "G then P", icon: SquareStack, path: "projects" },
    { label: "Go to cycles", detail: "", icon: Layers3, path: "cycles" },
    { label: "Open inbox", detail: "G then N", icon: Bell, path: "inbox" },
    { label: "Open settings", detail: "", icon: Settings2, path: "settings" },
    { label: `Use ${theme === "light" ? "dark" : "light"} mode`, detail: "", icon: theme === "light" ? Moon : Sun, action: () => setTheme(theme === "light" ? "dark" : "light") },
  ];
  const results = useMemo(() => {
    const term = query.toLowerCase();
    const matches = issues.filter((issue) => `${issue.identifier} ${issue.title}`.toLowerCase().includes(term)).slice(0, 5);
    return matches;
  }, [issues, query]);
  if (!open) return null;
  const run = (command: typeof commands[number]) => { command.action?.(); if (command.path) router.push(`/${workspaceSlug}/${command.path}`); setOpen(false); setQuery(""); };
  return <div className="modal-backdrop command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><div className="command-menu" role="dialog" aria-modal="true" aria-label="Command menu">
    <div className="command-search"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues or run a command…" /><Kbd>Esc</Kbd></div>
    <div className="command-results">
      {query && results.length > 0 && <><p>Issues</p>{results.map((issue) => <button key={issue.id} onClick={() => { selectIssue(issue.id); router.push(`/${workspaceSlug}/issues`); setOpen(false); }}><StatusIcon status={issue.status} /><span><strong>{issue.title}</strong><small>{issue.identifier}</small></span></button>)}</>}
      <p>{query ? "Commands" : "Quick actions"}</p>
      {commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase())).map((command) => { const Icon = command.icon; return <button key={command.label} onClick={() => run(command)}><Icon size={16} /><span><strong>{command.label}</strong></span>{command.detail && <Kbd>{command.detail}</Kbd>}</button>; })}
      {query && !results.length && !commands.some((command) => command.label.toLowerCase().includes(query.toLowerCase())) && <div className="command-empty"><Search size={22} /><strong>No results for “{query}”</strong><span>Try an issue ID, title, or command.</span></div>}
    </div>
    <div className="command-footer"><span><Kbd>↑</Kbd><Kbd>↓</Kbd> Navigate</span><span><Kbd>↵</Kbd> Open</span><span><Command size={12} /> Orbit command</span></div>
  </div></div>;
}

export function ShortcutDialog() {
  const open = useWorkspaceStore((state) => state.shortcutOpen);
  const setOpen = useWorkspaceStore((state) => state.setShortcutOpen);
  if (!open) return null;
  const groups = [
    { title: "Create and find", items: [["Create issue", "C"], ["Search", "/"], ["Command menu", "⌘ K"]] },
    { title: "Navigate", items: [["Go to issues", "G I"], ["Go to projects", "G P"], ["Go to inbox", "G N"]] },
    { title: "General", items: [["Close dialog", "Esc"], ["Shortcut help", "?"]] },
  ];
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><div className="shortcut-dialog"><div className="dialog-header"><strong>Keyboard shortcuts</strong><button onClick={() => setOpen(false)}><X size={17} /></button></div><div className="shortcut-grid">{groups.map((group) => <section key={group.title}><h3>{group.title}</h3>{group.items.map(([label, keys]) => <p key={label}><span>{label}</span><Kbd>{keys}</Kbd></p>)}</section>)}</div><div className="dialog-footer"><span>Shortcuts pause while you’re typing.</span><CheckCircle2 size={16} /></div></div></div>;
}
