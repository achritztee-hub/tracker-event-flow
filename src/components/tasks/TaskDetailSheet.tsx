import { useEffect, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { teamLabels, type Team, getInitials } from "@/lib/teams";
import {
  priorityClass, priorityLabels, statusBadgeClass, statusLabels,
  type TaskPriority, type TaskStatus,
} from "@/lib/tasks";
import { toast } from "sonner";
import type { TaskRow } from "./types";

interface HistoryEntry {
  from: string;
  to: string;
  by: string;
  at: string;
}

interface Props {
  task: TaskRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assigneeNames: Record<string, string>;
  onUpdated: () => void;
}

const TaskDetailSheet = ({ task, open, onOpenChange, assigneeNames, onUpdated }: Props) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) setStatus(task.status as TaskStatus);
  }, [task]);

  if (!task) return null;

  const team = (task.assigned_team ?? "management") as Team;
  const due = task.due_date ? parseISO(task.due_date) : null;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStatus(newStatus);
    toast.success("Status tugas diperbarui");
    onUpdated();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-2">
            <SheetTitle className="leading-snug">{task.title}</SheetTitle>
          </div>
          <SheetDescription className="flex flex-wrap gap-2 pt-1">
            <span className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
              statusBadgeClass(task.status),
            )}>
              {statusLabels[task.status as TaskStatus] ?? task.status}
            </span>
            <span className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
              priorityClass(task.priority),
            )}>
              {priorityLabels[task.priority as TaskPriority] ?? task.priority}
            </span>
            <span className="inline-flex rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-[10px] font-medium">
              {teamLabels[team]}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {task.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Deskripsi</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <p className="mt-1 text-sm">{due ? format(due, "d MMM yyyy") : "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Dibuat</Label>
              <p className="mt-1 text-sm">{format(parseISO(task.created_at), "d MMM yyyy")}</p>
            </div>
          </div>

          {task.assigned_to && task.assigned_to.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Anggota</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {task.assigned_to.map((id) => (
                  <div key={id} className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {getInitials(assigneeNames[id] ?? "?")}
                    </div>
                    <span className="text-xs">{assigneeNames[id] ?? "Unknown"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Update Status</Label>
            <Select value={status} onValueChange={(v) => handleStatusChange(v as TaskStatus)} disabled={saving}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Selesai</SelectItem>
              </SelectContent>
            </Select>
            {saving && <Loader2 className="mt-2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Riwayat</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  •
                </div>
                <div className="text-xs">
                  <p>Terakhir diperbarui</p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(parseISO(task.updated_at), { addSuffix: true, locale: idLocale })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailSheet;
