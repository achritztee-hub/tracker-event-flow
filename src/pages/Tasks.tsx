import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCanAddTask } from "@/hooks/useCanAddTask";
import { teamLabels, type Team } from "@/lib/teams";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import TaskListView from "@/components/tasks/TaskListView";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import TaskDetailSheet from "@/components/tasks/TaskDetailSheet";
import type { EventLite, TaskRow } from "@/components/tasks/types";

type ViewMode = "kanban" | "list";
const VIEW_KEY = "tasks_view_mode";

const TEAM_OPTIONS: Team[] = ["advertising", "social_media", "marketing"];

const TasksPage = () => {
  const { canAdd } = useCanAddTask();
  const [view, setView] = useState<ViewMode>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(VIEW_KEY) : null;
    return (saved as ViewMode) || "kanban";
  });

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [eventFilter, setEventFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<TaskRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: ts }, { data: ev }, { data: pf }] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("id,title,status").order("start_date", { ascending: false }),
      supabase.from("profiles").select("id,full_name"),
    ]);
    setTasks((ts as TaskRow[]) ?? []);
    setEvents((ev as EventLite[]) ?? []);
    const map: Record<string, string> = {};
    (pf ?? []).forEach((p) => { map[p.id] = p.full_name ?? "Unnamed"; });
    setAssigneeNames(map);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (eventFilter !== "all" && t.event_id !== eventFilter) return false;
      if (teamFilter !== "all" && t.assigned_team !== teamFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [tasks, eventFilter, teamFilter, priorityFilter, search]);

  const handleSelect = (t: TaskRow) => {
    setSelected(t);
    setDetailOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {filtered.length} dari {tasks.length} tugas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canAdd && (
              <Button onClick={() => setAddOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Tambah Tugas
              </Button>
            )}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition",
                  view === "kanban" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition",
                  view === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                )}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas..."
              className="pl-8 h-9"
            />
          </div>

          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Event" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Event</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Tim" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tim</SelectItem>
              {TEAM_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{teamLabels[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Prioritas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prioritas</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-12">Memuat tugas...</div>
        ) : view === "kanban" ? (
          <KanbanBoard tasks={filtered} assigneeNames={assigneeNames} onSelect={handleSelect} />
        ) : (
          <TaskListView tasks={filtered} assigneeNames={assigneeNames} onSelect={handleSelect} />
        )}
      </div>

      {canAdd && (
        <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} onCreated={loadAll} />
      )}
      <TaskDetailSheet
        task={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        assigneeNames={assigneeNames}
        onUpdated={loadAll}
      />
    </AppShell>
  );
};

export default TasksPage;
