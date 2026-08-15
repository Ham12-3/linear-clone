"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useDraggable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDownUp, Check, ChevronDown, Columns3, Filter, LayoutList, ListFilter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { clsx } from "clsx";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Issue, Label, PriorityKey, Project, StatusKey } from "@/types/domain";
import { Avatar, CommentCount, PriorityIcon, StatusIcon } from "@/components/ui/primitives";
import { IssuePanel } from "@/components/issues/issue-panel";
import { updateIssueAction } from "@/app/[workspaceSlug]/actions";

type DisplayMode = "list" | "board";

export function IssuesView({ route }: { route: string }) {
  const issues = useWorkspaceStore((state) => state.issues);
  const statuses = useWorkspaceStore((state) => state.statuses);
  const projects = useWorkspaceStore((state) => state.projects);
  const labels = useWorkspaceStore((state) => state.labels);
  const currentUserId = useWorkspaceStore((state) => state.currentUser.id);
  const workspaceSlug = useWorkspaceStore((state) => state.workspace.slug);
  const team = useWorkspaceStore((state) => state.team);
  const updateIssue = useWorkspaceStore((state) => state.updateIssue);
  const selectIssue = useWorkspaceStore((state) => state.selectIssue);
  const selectedIssueId = useWorkspaceStore((state) => state.selectedIssueId);
  const setCreateOpen = useWorkspaceStore((state) => state.setCreateOpen);
  const [mode, setMode] = useState<DisplayMode>("list");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<PriorityKey | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const isMyIssues = route === "my-issues";

  const visibleIssues = useMemo(() => issues.filter((issue) => {
    const matchesOwner = !isMyIssues || issue.assigneeId === currentUserId;
    const matchesQuery = !query || `${issue.identifier} ${issue.title}`.toLowerCase().includes(query.toLowerCase());
    const matchesPriority = priority === "all" || issue.priority === priority;
    return matchesOwner && matchesQuery && matchesPriority;
  }), [currentUserId, isMyIssues, issues, priority, query]);

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const target = String(over.id).replace("status-", "") as StatusKey;
    const targetStatus = statuses.find((status) => status.id === target);
    const issue = issues.find((item) => item.id === String(active.id));
    if (!targetStatus?.dbId || !issue || issue.status === target) return;
    const previousStatus = issue.status;
    setMutationError("");
    updateIssue(issue.id, { status: target });
    const result = await updateIssueAction(workspaceSlug, issue.id, { statusId: targetStatus.dbId });
    if (result.ok) updateIssue(issue.id, result.issue);
    else { updateIssue(issue.id, { status: previousStatus }); setMutationError(result.error); }
  };

  const pageTitle = isMyIssues ? "My issues" : route.startsWith("team/") ? team.name : "All issues";

  return (
    <section className="page-frame issues-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{isMyIssues ? "Personal queue" : `${team.name} workspace`}</p>
          <h1>{pageTitle}</h1>
          <span className="heading-note">{visibleIssues.length} issues · updated moments ago</span>
        </div>
        <div className="heading-actions">
          <button className="button subtle"><SlidersHorizontal size={14} />View</button>
          <button className="button primary" onClick={() => setCreateOpen(true)}><Plus size={15} />New issue</button>
        </div>
      </div>
      <div className="view-toolbar">
        <div className="view-tabs">
          <button className={clsx(mode === "list" && "active")} onClick={() => setMode("list")}><LayoutList size={15} />List</button>
          <button className={clsx(mode === "board" && "active")} onClick={() => setMode("board")}><Columns3 size={15} />Board</button>
        </div>
        <div className="toolbar-spacer" />
        <div className="inline-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter issues…" aria-label="Filter issues" />{query && <button onClick={() => setQuery("")}><X size={13} /></button>}</div>
        <button className={clsx("toolbar-button", showFilters && "active")} onClick={() => setShowFilters(!showFilters)}><Filter size={14} />Filter{priority !== "all" && <span className="filter-count">1</span>}</button>
        <button className="toolbar-button"><ArrowDownUp size={14} />Updated<ChevronDown size={12} /></button>
      </div>
      {showFilters && <div className="filter-bar"><span><ListFilter size={14} />Priority</span>{(["all", "urgent", "high", "medium", "low"] as const).map((item) => <button key={item} onClick={() => setPriority(item)} className={priority === item ? "active" : ""}>{item === "all" ? "Any" : <><PriorityIcon priority={item} />{item}</>}</button>)}<div className="filter-result">Showing {visibleIssues.length} of {issues.length}</div></div>}
      {mutationError && <div className="workspace-mutation-error" role="alert">{mutationError}<button onClick={() => setMutationError("")}><X size={13} /></button></div>}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {mode === "list" ? <IssueList issues={visibleIssues} projects={projects} labels={labels} onSelect={selectIssue} selectedId={selectedIssueId} /> : <IssueBoard issues={visibleIssues} projects={projects} labels={labels} statuses={statuses.map((status) => status.id)} onSelect={selectIssue} selectedId={selectedIssueId} />}
      </DndContext>
      {selectedIssueId && <IssuePanel key={selectedIssueId} issueId={selectedIssueId} />}
    </section>
  );
}

function IssueList({ issues, projects, labels, onSelect, selectedId }: { issues: Issue[]; projects: Project[]; labels: Label[]; onSelect: (id: string) => void; selectedId: string | null }) {
  const statuses = useWorkspaceStore((state) => state.statuses);
  const grouped = statuses.map((status) => ({ status, issues: issues.filter((issue) => issue.status === status.id) })).filter((group) => group.issues.length > 0);
  if (!issues.length) return <EmptyIssues />;
  return <div className="issue-list" role="table" aria-label="Issues">
    <div className="issue-table-head" role="row"><span /><span>Issue</span><span>Priority</span><span>Project</span><span>Assignee</span><span>Updated</span></div>
    {grouped.map((group) => <div className="issue-group" key={group.status.id}>
      <div className="issue-group-head"><StatusIcon status={group.status.id} /><strong>{group.status.name}</strong><span>{group.issues.length}</span><div /><button><Plus size={14} /></button><button><ChevronDown size={14} /></button></div>
      {group.issues.map((issue) => <IssueRow key={issue.id} issue={issue} projects={projects} labels={labels} onSelect={onSelect} selected={selectedId === issue.id} />)}
    </div>)}
  </div>;
}

function IssueRow({ issue, projects, labels, onSelect, selected }: { issue: Issue; projects: Project[]; labels: Label[]; onSelect: (id: string) => void; selected: boolean }) {
  const project = projects.find((item) => item.id === issue.projectId);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: issue.id });
  return <button ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} {...listeners} {...attributes} className={clsx("issue-row", selected && "selected", isDragging && "dragging")} onClick={() => onSelect(issue.id)} role="row">
    <span className="row-check" onClick={(event) => event.stopPropagation()}><span /></span>
    <span className="issue-main"><span className="issue-id">{issue.identifier}</span><strong>{issue.title}</strong><span className="row-labels">{issue.labels.slice(0, 1).map((id) => { const label = labels.find((item) => item.id === id); return label && <em key={id} style={{ "--label": label.color } as React.CSSProperties}>{label.name}</em>; })}</span><CommentCount count={issue.comments} /></span>
    <span className="priority-cell"><PriorityIcon priority={issue.priority} /><span>{issue.priority}</span></span>
    <span className="project-cell">{project ? <><i style={{ background: project.color }} />{project.name}</> : <small>—</small>}</span>
    <span><Avatar personId={issue.assigneeId} size="sm" /></span>
    <span className="updated-cell">{issue.updatedAt}</span>
  </button>;
}

function IssueBoard({ issues, projects, labels, statuses, onSelect, selectedId }: { issues: Issue[]; projects: Project[]; labels: Label[]; statuses: StatusKey[]; onSelect: (id: string) => void; selectedId: string | null }) {
  return <div className="board-scroll"><div className="issue-board">
    {statuses.map((status) => <BoardColumn key={status} status={status} projects={projects} labels={labels} issues={issues.filter((issue) => issue.status === status)} onSelect={onSelect} selectedId={selectedId} />)}
  </div></div>;
}

function BoardColumn({ status, issues, projects, labels, onSelect, selectedId }: { status: StatusKey; issues: Issue[]; projects: Project[]; labels: Label[]; onSelect: (id: string) => void; selectedId: string | null }) {
  const statuses = useWorkspaceStore((state) => state.statuses);
  const { setNodeRef, isOver } = useDroppable({ id: `status-${status}` });
  const statusConfig = statuses.find((item) => item.id === status)!;
  return <div ref={setNodeRef} className={clsx("board-column", isOver && "is-over")}>
    <div className="board-column-head"><StatusIcon status={status} /><strong>{statusConfig.name}</strong><span>{issues.length}</span><div /><button><Plus size={14} /></button><button><ChevronDown size={14} /></button></div>
    <div className="board-cards">{issues.map((issue) => <BoardCard key={issue.id} issue={issue} projects={projects} labels={labels} onSelect={onSelect} selected={selectedId === issue.id} />)}{!issues.length && <div className="board-empty">Drop an issue here</div>}</div>
  </div>;
}

function BoardCard({ issue, projects, labels, onSelect, selected }: { issue: Issue; projects: Project[]; labels: Label[]; onSelect: (id: string) => void; selected: boolean }) {
  const project = projects.find((item) => item.id === issue.projectId);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: issue.id });
  return <button ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} {...listeners} {...attributes} onClick={() => onSelect(issue.id)} className={clsx("board-card", selected && "selected", isDragging && "dragging")}>
    <span className="board-card-top"><span className="issue-id">{issue.identifier}</span><PriorityIcon priority={issue.priority} /></span>
    <strong>{issue.title}</strong>
    <span className="board-card-labels">{issue.labels.slice(0, 2).map((id) => { const label = labels.find((item) => item.id === id); return label && <em key={id}><i style={{ background: label.color }} />{label.name}</em>; })}</span>
    <span className="board-card-bottom"><span>{project && <><i style={{ background: project.color }} />{project.name}</>}</span><span><CommentCount count={issue.comments} /><Avatar personId={issue.assigneeId} size="sm" /></span></span>
  </button>;
}

function EmptyIssues() {
  return <div className="empty-state"><div className="empty-orbit"><Check size={22} /></div><h3>No issues match this view</h3><p>Adjust the active filters or create a new issue.</p></div>;
}
