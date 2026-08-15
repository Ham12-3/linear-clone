import { z } from "zod";

export const issueInputSchema = z.object({
  title: z.string().trim().min(2, "Add a title with at least 2 characters").max(180),
  team: z.string().trim().min(1),
  status: z.enum(["backlog", "todo", "progress", "review", "done"]),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]),
});

export function getFractionalRank(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return 1000;
  if (before === undefined) return (after ?? 1000) - 1000;
  if (after === undefined) return before + 1000;
  return before + (after - before) / 2;
}
