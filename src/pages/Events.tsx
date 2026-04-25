import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarRange, Plus, Power, PowerOff, Trash2, Loader2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import AddEventSheet from "@/components/dashboard/AddEventSheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

type StatusFilter = "active" | "inactive" | "all";

const filterTabs: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "Aktif" },
  { key: "inactive", label: "Nonaktif" },
  { key: "all", label: "Semua" },
];

const isInactive = (status: string) => status !== "active";

const Events = () => {
  const { profile } = useAuth();
  const isManager = profile?.role_id === "events_manager";

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("active");
  const [openAdd, setOpenAdd] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, status, start_date, end_date, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "active") return e.status === "active";
    return isInactive(e.status);
  });

  const handleToggle = async (e: EventRow) => {
    if (!isManager) return;
    setTogglingId(e.id);
    const next = e.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("events")
      .update({ status: next })
      .eq("id", e.id);
    setTogglingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next === "active" ? "Event diaktifkan" : "Event dinonaktifkan");
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("events").delete().eq("id", confirmDelete.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event dihapus");
    setConfirmDelete(null);
    load();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Event</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola semua event tim Anda — aktifkan, nonaktifkan, atau hapus.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-muted p-1">
              {filterTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                    filter === t.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {isManager && (
              <Button onClick={() => setOpenAdd(true)} size="sm">
                <Plus className="h-4 w-4" />
                Tambah Event
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <CalendarRange className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold">
              {filter === "active" ? "Belum ada event aktif" : filter === "inactive" ? "Belum ada event nonaktif" : "Belum ada event"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {isManager ? "Buat event baru untuk mulai melacak performa tim." : "Hubungi events manager untuk membuat event."}
            </p>
            {isManager && (
              <Button onClick={() => setOpenAdd(true)} className="mt-5">
                <Plus className="h-4 w-4" />
                Tambah Event
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => {
              const active = e.status === "active";
              return (
                <div
                  key={e.id}
                  className="group relative rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold tracking-tight">{e.title}</h3>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {e.start_date && e.end_date
                          ? `${format(new Date(e.start_date), "d MMM yyyy")} – ${format(new Date(e.end_date), "d MMM yyyy")}`
                          : "—"}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {e.description && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{e.description}</p>
                  )}

                  {isManager && (
                    <div className="mt-5 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={active ? "outline" : "default"}
                        onClick={() => handleToggle(e)}
                        disabled={togglingId === e.id}
                        className="flex-1"
                      >
                        {togglingId === e.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : active ? (
                          <>
                            <PowerOff className="h-3.5 w-3.5" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5" />
                            Aktifkan
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(e)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddEventSheet open={openAdd} onOpenChange={setOpenAdd} onCreated={load} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus event?</AlertDialogTitle>
            <AlertDialogDescription>
              Event "{confirmDelete?.title}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(ev) => {
                ev.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default Events;
