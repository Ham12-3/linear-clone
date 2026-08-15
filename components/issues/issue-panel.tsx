"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Check, ChevronDown, Copy, ExternalLink, Link2, MoreHorizontal, Paperclip, Send, Sparkles, Trash2, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { PriorityKey, StatusKey } from "@/types/domain";
import { Avatar, PriorityIcon, StatusIcon } from "@/components/ui/primitives";
import { deleteIssueAction, updateIssueAction } from "@/app/[workspaceSlug]/actions";
import type { UpdateIssuePayload } from "@/types/issue-actions";

const priorities: { id: PriorityKey; label: string }[] = [
  { id: "urgent", label: "Urgent" }, { id: "high", label: "High" }, { id: "medium", label: "Medium" }, { id: "low", label: "Low" }, { id: "none", label: "No priority" },
];

export function IssuePanel({ issueId }: { issueId: string }) {
  const issue = useWorkspaceStore((state) => state.issues.find((item) => item.id === issueId));
  const workspaceSlug = useWorkspaceStore((state) => state.workspace.slug);
  const team = useWorkspaceStore((state) => state.team);
  const currentUser = useWorkspaceStore((state) => state.currentUser);
  const people = useWorkspaceStore((state) => state.people);
  const statuses = useWorkspaceStore((state) => state.statuses);
  const projects = useWorkspaceStore((state) => state.projects);
  const cycles = useWorkspaceStore((state) => state.cycles);
  const labels = useWorkspaceStore((state) => state.labels);
  const selectIssue = useWorkspaceStore((state) => state.selectIssue);
  const updateIssue = useWorkspaceStore((state) => state.updateIssue);
  const deleteIssue = useWorkspaceStore((state) => state.deleteIssue);
  const [comment, setComment] = useState("");
  const [localComments, setLocalComments] = useState<{ text: string; time: string }[]>([]);
  const [title, setTitle] = useState(issue?.title ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");
  const [mutationError, setMutationError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!issue) return null;
  const project = projects.find((item) => item.id === issue.projectId);
  const cycle = cycles.find((item) => item.id === issue.cycleId);

  const persist = (localPatch: Parameters<typeof updateIssue>[1], payload: UpdateIssuePayload) => {
    const previous = { ...issue };
    setMutationError("");
    updateIssue(issue.id, localPatch);
    startTransition(async () => {
      const result = await updateIssueAction(workspaceSlug, issue.id, payload);
      if (result.ok) updateIssue(issue.id, result.issue);
      else {
        updateIssue(issue.id, previous);
        setTitle(previous.title);
        setDescription(previous.description);
        setMutationError(result.error);
      }
    });
  };

  const addComment = () => {
    if (!comment.trim()) return;
    setLocalComments((items) => [...items, { text: comment.trim(), time: "Now" }]);
    updateIssue(issue.id, { comments: issue.comments + 1 });
    setComment("");
  };

  return <div className="panel-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) selectIssue(null); }}>
    <aside className="issue-panel" aria-label={`${issue.identifier} details`}>
      <div className="panel-toolbar">
        <div><button onClick={() => selectIssue(null)} aria-label="Close issue"><X size={17} /></button><span className="panel-team-mark">{team.key}</span><span>{issue.identifier}</span></div>
        <div><button title="Copy link"><Link2 size={15} /></button><button title="Open full page"><ExternalLink size={15} /></button><button title="More"><MoreHorizontal size={17} /></button></div>
      </div>
      <div className="panel-scroll">
        <div className="issue-title-block"><span className="issue-id">{issue.identifier}</span><textarea value={title} rows={2} onChange={(event) => setTitle(event.target.value)} onBlur={() => { if (title.trim() !== issue.title && title.trim().length >= 2) persist({ title: title.trim() }, { title: title.trim() }); }} aria-label="Issue title" /></div>
        {mutationError && <div className="workspace-mutation-error" role="alert">{mutationError}<button onClick={() => setMutationError("")}><X size={13} /></button></div>}
        <div className="property-row">
          <PropertySelect disabled={pending} label="Status" value={issue.status} onChange={(value) => { const status = statuses.find((item) => item.id === value as StatusKey); if (status?.dbId) persist({ status: status.id }, { statusId: status.dbId }); }} icon={<StatusIcon status={issue.status} />} options={statuses.map((status) => ({ value: status.id, label: status.name, icon: <StatusIcon status={status.id} /> }))} />
          <PropertySelect disabled={pending} label="Priority" value={issue.priority} onChange={(value) => persist({ priority: value as PriorityKey }, { priority: value as PriorityKey })} icon={<PriorityIcon priority={issue.priority} />} options={priorities.map((priority) => ({ value: priority.id, label: priority.label, icon: <PriorityIcon priority={priority.id} /> }))} />
          <PropertySelect disabled={pending} label="Assignee" value={issue.assigneeId ?? ""} onChange={(value) => persist({ assigneeId: value || null }, { assigneeId: value || null })} icon={<Avatar personId={issue.assigneeId} size="sm" />} options={[{ value: "", label: "Unassigned" }, ...people.map((person) => ({ value: person.id, label: person.name, icon: <Avatar personId={person.id} size="sm" /> }))]} />
        </div>
        <section className="panel-section description-section"><div className="section-heading"><h3>Description</h3><button><Sparkles size={14} />Improve</button></div><textarea value={description} onChange={(event) => setDescription(event.target.value)} onBlur={() => { if (description !== issue.description) persist({ description }, { description }); }} rows={6} aria-label="Issue description" /><div className="editor-tools"><button><Paperclip size={14} />Attach</button><span>Markdown supported</span></div></section>
        <section className="panel-section issue-properties"><h3>Properties</h3><div className="property-grid">
          <label><span>Project</span><select disabled={pending} value={issue.projectId ?? ""} onChange={(event) => persist({ projectId: event.target.value || null }, { projectId: event.target.value || null })}><option value="">No project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{project && <i style={{ background: project.color }} />}</label>
          <label><span>Cycle</span><select disabled={pending} value={issue.cycleId ?? ""} onChange={(event) => persist({ cycleId: event.target.value || null }, { cycleId: event.target.value || null })}><option value="">No cycle</option>{cycles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>{cycle?.range}</small></label>
          <label><span>Due date</span><input disabled={pending} type="date" value={issue.dueDate ?? ""} onChange={(event) => persist({ dueDate: event.target.value || null }, { dueDate: event.target.value || null })} /><CalendarDays size={14} /></label>
          <label><span>Estimate</span><select disabled={pending} value={issue.estimate ?? ""} onChange={(event) => persist({ estimate: event.target.value ? Number(event.target.value) : null }, { estimate: event.target.value ? Number(event.target.value) : null })}><option value="">No estimate</option>{[1, 2, 3, 5, 8].map((point) => <option key={point} value={point}>{point} points</option>)}</select></label>
        </div><div className="selected-labels">{issue.labels.map((id) => { const label = labels.find((item) => item.id === id); return label && <span key={id} style={{ "--label": label.color } as React.CSSProperties}><i />{label.name}</span>; })}<button>+ Label</button></div></section>
        <section className="panel-section subissues"><div className="section-heading"><h3>Sub-issues</h3><span>2 / 3</span></div><div className="subissue-progress"><i style={{ width: "66%" }} /></div>{["Profile slow query path", "Add trigram index", "Benchmark production dataset"].map((title, index) => <button key={title}><span className={index < 2 ? "sub-done" : ""}>{index < 2 ? <Check size={12} /> : null}</span><span>{title}</span><small>ENG-{145 + index}</small></button>)}</section>
        <section className="panel-section activity-section"><div className="section-heading"><h3>Activity</h3><span>Subscribe</span></div><ActivityItem person={people[1]?.name ?? currentUser.name} time="24 min ago">moved this issue from <strong>Todo</strong> to <strong>In progress</strong></ActivityItem><ActivityItem person={people[2]?.name ?? currentUser.name} time="1h ago">linked this issue to <strong>{project?.name ?? "the workspace"}</strong></ActivityItem>{localComments.map((item, index) => <ActivityItem key={index} person={currentUser.name} time={item.time}><p className="activity-comment">{item.text}</p></ActivityItem>)}</section>
      </div>
      <div className="comment-composer"><Avatar personId={currentUser.id} size="sm" /><textarea value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") addComment(); }} placeholder="Leave a comment…" rows={2} /><div><button><Paperclip size={14} /></button><span>⌘ Enter to send</span><button className="send-button" onClick={addComment} disabled={!comment.trim()}><Send size={14} /></button></div></div>
      <div className="danger-row"><button disabled={pending} onClick={() => { if (!window.confirm(`Delete ${issue.identifier}? This cannot be undone.`)) return; startTransition(async () => { const result = await deleteIssueAction(workspaceSlug, issue.id); if (result.ok) deleteIssue(issue.id); else setMutationError(result.error); }); }}><Trash2 size={14} />Delete issue</button><button><Copy size={14} />Duplicate</button></div>
    </aside>
  </div>;
}

function PropertySelect({ label, value, onChange, icon, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; icon: React.ReactNode; options: { value: string; label: string; icon?: React.ReactNode }[]; disabled?: boolean }) {
  return <label className="property-select" title={label}>{icon}<select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>{options.map((option) => <option key={option.value || "none"} value={option.value}>{option.label}</option>)}</select><ChevronDown size={12} /></label>;
}

function ActivityItem({ person, time, children }: { person: string; time: string; children: React.ReactNode }) {
  const people = useWorkspaceStore((state) => state.people);
  const member = people.find((item) => item.name === person);
  return <div className="activity-item"><Avatar personId={member?.id ?? null} size="sm" /><div><p><strong>{person}</strong> {children}</p><time>{time}</time></div></div>;
}
