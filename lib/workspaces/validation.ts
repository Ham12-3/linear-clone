import { z } from "zod";

export const workspaceSetupSchema = z.object({
  workspaceName: z.string().trim().min(2, "Enter a workspace name").max(60),
  workspaceSlug: z.string().trim().toLowerCase().min(3, "Use at least 3 characters").max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens"),
  teamName: z.string().trim().min(2, "Enter a team name").max(50),
  teamKey: z.string().trim().toUpperCase().min(2, "Use at least 2 letters").max(6).regex(/^[A-Z][A-Z0-9]*$/, "Use 2–6 uppercase letters or numbers"),
});
