import { cn } from "@/lib/utils";
import { statusLabels, statusOrder, type TaskStatus } from "@/lib/tasks";
import TaskCard from "./TaskCard";
import type { TaskRow } from "./types";

interface Props {
  tasks: TaskRow[];
  assigneeNames: Record<string, string>;
  onSelect: (t: TaskRow) => void;
}

const KanbanBoard = ({ tasks, assigneeNames, onSelect }: Props) => {
  const grouped: Record<TaskStatus, TaskRow[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  tasks.forEach((t) => {
    const s = (t.status as TaskStatus) in grouped ? (t.status as TaskStatus) : "todo";
    grouped[s].push(t);
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {statusOrder.map((status) => (
        <div
          key={status}
          className={cn(
            "rounded-2xl border border-border bg-muted/40 p-3 min-h-[300px]",
          )}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold">{statusLabels[status]}</h3>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
              {grouped[status].length}
            </span>
          </div>
          <div className="space-y-2">
            {grouped[status].map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                assigneeNames={assigneeNames}
                onClick={() => onSelect(t)}
              />
            ))}
            {grouped[status].length === 0 && (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                Tidak ada tugas
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
