import { format, isPast, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { teamLabels, teamColorClass, getInitials, type Team } from "@/lib/teams";
import { priorityClass, priorityLabels, type TaskPriority } from "@/lib/tasks";
import type { TaskRow } from "./types";

interface Props {
  task: TaskRow;
  assigneeNames: Record<string, string>;
  onClick: () => void;
}

const TaskCard = ({ task, assigneeNames, onClick }: Props) => {
  const team = (task.assigned_team ?? "management") as Team;
  const due = task.due_date ? parseISO(task.due_date) : null;
  const overdue = due && isPast(due) && task.status !== "done";

  const assignees = (task.assigned_to ?? []).slice(0, 4);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-snug line-clamp-2">{task.title}</h4>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            priorityClass(task.priority),
          )}
        >
          {priorityLabels[task.priority as TaskPriority] ?? task.priority}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white",
            teamColorClass[team],
          )}
        >
          {teamLabels[team]}
        </span>
        {due && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              overdue ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {format(due, "d MMM")}
          </span>
        )}
      </div>

      {assignees.length > 0 && (
        <div className="mt-3 flex -space-x-2">
          {assignees.map((id) => (
            <div
              key={id}
              title={assigneeNames[id] ?? "Member"}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-secondary-foreground"
            >
              {getInitials(assigneeNames[id] ?? "?")}
            </div>
          ))}
          {(task.assigned_to?.length ?? 0) > assignees.length && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
              +{(task.assigned_to!.length) - assignees.length}
            </div>
          )}
        </div>
      )}
    </button>
  );
};

export default TaskCard;
