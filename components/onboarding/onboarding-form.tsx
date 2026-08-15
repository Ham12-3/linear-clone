"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Check, UsersRound } from "lucide-react";
import { createWorkspaceAction } from "@/lib/workspaces/actions";
import { initialWorkspaceSetupState } from "@/lib/workspaces/action-state";

export function OnboardingForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(createWorkspaceAction, initialWorkspaceSetupState);
  const [workspaceName, setWorkspaceName] = useState("");
  const suggestedSlug = workspaceName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return <main className="onboarding-shell"><div className="onboarding-card">
    <div className="onboarding-progress"><span className="complete"><Check size={12} /></span><i /><span className="active">2</span><i /><span>3</span></div>
    <p className="eyebrow">Workspace setup</p><h1>Welcome, {name.split(" ")[0]}</h1><p className="onboarding-detail">Create a home for your team. You can invite people and add more teams after this step.</p>
    <form action={action}>
      <label><span>Workspace name</span><input name="workspaceName" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Acme Technologies" required />{state.fieldErrors?.workspaceName && <small>{state.fieldErrors.workspaceName[0]}</small>}</label>
      <label><span>Workspace URL</span><div className="onboarding-slug"><small>orbit.work/</small><input name="workspaceSlug" key={suggestedSlug} defaultValue={suggestedSlug} placeholder="acme" required /></div>{state.fieldErrors?.workspaceSlug && <small>{state.fieldErrors.workspaceSlug[0]}</small>}</label>
      <div className="onboarding-team"><span className="onboarding-team-icon"><UsersRound size={17} /></span><div><strong>First team</strong><small>Issues are numbered per team.</small></div></div>
      <div className="onboarding-pair"><label><span>Team name</span><input name="teamName" defaultValue="Engineering" required />{state.fieldErrors?.teamName && <small>{state.fieldErrors.teamName[0]}</small>}</label><label><span>Identifier</span><input name="teamKey" defaultValue="ENG" maxLength={6} required />{state.fieldErrors?.teamKey && <small>{state.fieldErrors.teamKey[0]}</small>}</label></div>
      {state.message && <p className="auth-notice error">{state.message}</p>}
      <button className="button primary auth-submit" disabled={pending}>{pending ? "Creating workspace…" : <>Create workspace <ArrowRight size={15} /></>}</button>
    </form>
  </div></main>;
}
