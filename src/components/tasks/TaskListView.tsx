import { useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { teamLabels, type Team } from "@/lib/teams";
import {
  priorityClass, priorityLabels, statusBadgeClass, statusLabels,
  type TaskPriority, type TaskStatus,
} from "@/lib/tasks";
import type { TaskRow } from "./types";

interface Props {
  tasks: TaskRow[];
  assigneeNames: Record<string, string>;
  onSelect: (t: TaskRow) => void;
}

type SortKey = "title" | "assigned_team" | "priority" | "status" | "due_date";

const TaskListView = ({ tasks, assigneeNames, onSelect }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("due_date");
  const [asc, setAsc] = useState(true);

  const sorted = [...tasks].sort((a, b) => {
    const av = (a[sortKey] ?? "") as string;
    const bv = (b[sortKey] ?? "") as string;
    return asc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setAsc((p) => !p);
    else {
      setSortKey(k);
      setAsc(true);
    }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground"
    >
      {label}
      <ArrowUpDown className="h-3 w-3 opacity-60" />
    </button>
  );

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SortBtn k="title" label="Judul" /></TableHead>
            <TableHead><SortBtn k="assigned_team" label="Tim" /></TableHead>
            <TableHead><SortBtn k="priority" label="Prioritas" /></TableHead>
            <TableHead><SortBtn k="status" label="Status" /></TableHead>
            <TableHead><SortBtn k="due_date" label="Due Date" /></TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Tidak ada tugas
              </TableCell>
            </TableRow>
          )}
          {sorted.map((t) => {
            const due = t.due_date ? parseISO(t.due_date) : null;
            const overdue = due && isPast(due) && t.status !== "done";
            const team = (t.assigned_team ?? "management") as Team;
            return (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{teamLabels[team]}</span>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    priorityClass(t.priority),
                  )}>
                    {priorityLabels[t.priority as TaskPriority] ?? t.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    statusBadgeClass(t.status),
                  )}>
                    {statusLabels[t.status as TaskStatus] ?? t.status}
                  </span>
                </TableCell>
                <TableCell>
                  {due ? (
                    <span className={cn("text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
                      {format(due, "d MMM yyyy")}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {(t.assigned_to ?? []).map((id) => assigneeNames[id] ?? "?").join(", ") || "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => onSelect(t)}>Detail</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskListView;
