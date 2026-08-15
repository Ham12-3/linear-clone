"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { IssuesView } from "@/components/issues/issues-view";
import { ProjectView, CycleView, InboxView, SettingsView, DashboardView, GenericView } from "@/components/workspace-views";
import { CommandMenu, CreateIssueDialog, ShortcutDialog } from "@/components/overlays";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { WorkspaceBootstrap } from "@/types/domain";

export function WorkspaceApp({ workspaceSlug, route, initialData }: { workspaceSlug: string; route: string; initialData: WorkspaceBootstrap }) {
  const router = useRouter();
  const hydratedWorkspaceId = useWorkspaceStore((state) => state.hydratedWorkspaceId);
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrateWorkspace);
  const theme = useWorkspaceStore((state) => state.theme);
  const sidebarCollapsed = useWorkspaceStore((state) => state.sidebarCollapsed);
  const setCreateOpen = useWorkspaceStore((state) => state.setCreateOpen);
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const setShortcutOpen = useWorkspaceStore((state) => state.setShortcutOpen);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    hydrateWorkspace(initialData);
  }, [hydrateWorkspace, initialData]);

  useEffect(() => {
    let pendingG = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.matches("input, textarea, select, [contenteditable='true']");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setCreateOpen(false);
        setCommandOpen(false);
        setShortcutOpen(false);
        return;
      }
      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "c") setCreateOpen(true);
      if (event.key === "/" || event.key.toLowerCase() === "q") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "?") setShortcutOpen(true);
      if (pendingG) {
        const destinations: Record<string, string> = { i: "issues", p: "projects", m: "my-issues", n: "inbox" };
        const destination = destinations[event.key.toLowerCase()];
        if (destination) router.push(`/${workspaceSlug}/${destination}`);
        pendingG = false;
        if (timer) clearTimeout(timer);
      } else if (event.key.toLowerCase() === "g") {
        pendingG = true;
        timer = setTimeout(() => { pendingG = false; }, 900);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (timer) clearTimeout(timer);
    };
  }, [router, setCommandOpen, setCreateOpen, setShortcutOpen, workspaceSlug]);

  if (hydratedWorkspaceId !== initialData.workspace.id) {
    return <main className="workspace-loading"><span className="workspace-mark large"><span>{initialData.workspace.icon}</span></span><p>Loading {initialData.workspace.name}…</p></main>;
  }

  const content = route.startsWith("issues") || route === "my-issues" || route.startsWith("team/") || route.startsWith("view/")
    ? <IssuesView route={route} />
    : route === "projects" || route.startsWith("project/") ? <ProjectView />
    : route === "cycles" || route.startsWith("cycle/") ? <CycleView />
    : route === "inbox" ? <InboxView />
    : route.startsWith("settings") ? <SettingsView route={route} />
    : route === "dashboard" ? <DashboardView />
    : <GenericView title={route.replaceAll("-", " ")} />;

  return (
    <div className={sidebarCollapsed ? "app-shell sidebar-is-collapsed" : "app-shell"}>
      <Sidebar workspaceSlug={workspaceSlug} route={route} />
      <main className="workspace-main">
        <Topbar workspaceSlug={workspaceSlug} route={route} />
        {content}
      </main>
      <CreateIssueDialog />
      <CommandMenu workspaceSlug={workspaceSlug} />
      <ShortcutDialog />
    </div>
  );
}
