import { WorkspaceApp } from "@/components/workspace-app";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getWorkspaceMembership } from "@/lib/db/workspaces";
import { getWorkspaceBootstrap } from "@/lib/db/workspace-bootstrap";

interface WorkspacePageProps {
  params: Promise<{ workspaceSlug: string; path?: string[] }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceSlug, path = [] } = await params;
  const session = await auth();
  if (!session?.user.id) redirect("/login");
  const membership = await getWorkspaceMembership(workspaceSlug, session.user.id);
  if (!membership) redirect("/onboarding");
  const initialData = await getWorkspaceBootstrap(workspaceSlug, session.user.id);
  return <WorkspaceApp workspaceSlug={workspaceSlug} route={path.join("/") || "dashboard"} initialData={initialData} />;
}
