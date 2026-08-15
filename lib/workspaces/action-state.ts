export interface WorkspaceSetupState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialWorkspaceSetupState: WorkspaceSetupState = { status: "idle" };
