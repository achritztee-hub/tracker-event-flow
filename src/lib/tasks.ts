export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Selesai",
};

export const statusOrder: TaskStatus[] = ["todo", "in_progress", "done"];

export const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function priorityClass(p: string): string {
  switch (p) {
    case "high":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "medium":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function statusBadgeClass(s: string): string {
  switch (s) {
    case "done":
      return "bg-team-marketing/15 text-team-marketing border-team-marketing/30";
    case "in_progress":
      return "bg-primary/15 text-primary border-primary/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
