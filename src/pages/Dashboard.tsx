import { useEffect, useMemo, useState, useCallback } from "react";
import { CalendarCheck, ListChecks, FileBarChart, Users, Plus, CalendarRange } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import SummaryCard from "@/components/dashboard/SummaryCard";
import EventProgressCard from "@/components/dashboard/EventProgressCard";
import ActivityFeed, { ActivityItem } from "@/components/dashboard/ActivityFeed";
import DateRangeFilter, { DateRange, RangePreset, getRangeForPreset } from "@/components/dashboard/DateRangeFilter";
import AddEventSheet from "@/components/dashboard/AddEventSheet";
import EventPicker from "@/components/dashboard/EventPicker";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Team } from "@/lib/teams";
import { cn } from "@/lib/utils";

type EventRow = {
  id: string;
  title: string;
  status: "upcoming" | "active" | "completed";
  start_date: string | null;
  end_date: string | null;
};

type CountsState = {
  activeEvents: number;
  totalTasks: number;
  tasksByStatus: { todo: number; in_progress: number; done: number };
  totalReports: number;
  totalLeads: number;
  hotLeads: number;
};

const EXPECTED_PER_TEAM = 4; // expected reports per team per event

const teamProgressColors: Record<string, string> = {
  advertising: "bg-team-advertising",
  social_media: "bg-team-social",
  marketing: "bg-team-marketing",
};

const Dashboard = () => {
  const { profile } = useAuth();
  const isManager = profile?.role_id === "events_manager";

  const [preset, setPreset] = useState<RangePreset>("month");
  const [range, setRange] = useState<DateRange>(() => getRangeForPreset("month"));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<CountsState>({
    activeEvents: 0,
    totalTasks: 0,
    tasksByStatus: { todo: 0, in_progress: 0, done: 0 },
    totalReports: 0,
    totalLeads: 0,
    hotLeads: 0,
  });
  const [activeEventsList, setActiveEventsList] = useState<
    (EventRow & { progress: { team: string; uploaded: number }[] })[]
  >([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);

  const fromIso = useMemo(() => range.from.toISOString(), [range]);
  const toIso = useMemo(() => range.to.toISOString(), [range]);

  const loadAll = useCallback(async () => {
    setLoading(true);

    // 1. Active events count (always global, not affected by selected event)
    const { count: activeEventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 2. Tasks total + breakdown — filter by event if selected
    let tasksQuery = supabase
      .from("tasks")
      .select("status, created_at, event_id")
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    if (selectedEventId) tasksQuery = tasksQuery.eq("event_id", selectedEventId);
    const { data: tasksData } = await tasksQuery;
    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    (tasksData ?? []).forEach((t: any) => {
      if (t.status in tasksByStatus) tasksByStatus[t.status as keyof typeof tasksByStatus]++;
    });

    // 3. Reports total — filter by event if selected
    let reportsCountQuery = supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .gte("uploaded_at", fromIso)
      .lte("uploaded_at", toIso);
    if (selectedEventId) reportsCountQuery = reportsCountQuery.eq("event_id", selectedEventId);
    const { count: reportsCount } = await reportsCountQuery;

    // 4. Leads total + hot — filter by event if selected
    let leadsQuery = supabase
      .from("leads")
      .select("data_status, created_at, event_id")
      .gte("created_at", fromIso)
      .lte("created_at", toIso);
    if (selectedEventId) leadsQuery = leadsQuery.eq("event_id", selectedEventId);
    const { data: leadsData } = await leadsQuery;
    const leadsTotal = leadsData?.length ?? 0;
    const hotLeads = (leadsData ?? []).filter((l: any) => l.data_status === "hot").length;

    setCounts({
      activeEvents: activeEventsCount ?? 0,
      totalTasks: tasksData?.length ?? 0,
      tasksByStatus,
      totalReports: reportsCount ?? 0,
      totalLeads: leadsTotal,
      hotLeads,
    });

    // Active events list with team report progress (filter to selected if any)
    let eventsQuery = supabase
      .from("events")
      .select("id, title, status, start_date, end_date")
      .eq("status", "active")
      .order("start_date", { ascending: true });
    if (selectedEventId) eventsQuery = eventsQuery.eq("id", selectedEventId);
    const { data: events } = await eventsQuery;

    const eventIds = (events ?? []).map((e) => e.id);
    let reportsByEventTeam: Record<string, Record<string, number>> = {};
    if (eventIds.length) {
      const { data: reps } = await supabase
        .from("reports")
        .select("event_id, team")
        .in("event_id", eventIds);
      (reps ?? []).forEach((r: any) => {
        if (!r.event_id || !r.team) return;
        reportsByEventTeam[r.event_id] ??= {};
        reportsByEventTeam[r.event_id][r.team] = (reportsByEventTeam[r.event_id][r.team] ?? 0) + 1;
      });
    }

    setActiveEventsList(
      (events ?? []).map((e) => ({
        ...(e as EventRow),
        progress: ["advertising", "social_media", "marketing"].map((team) => ({
          team,
          uploaded: reportsByEventTeam[e.id]?.[team] ?? 0,
        })),
      }))
    );

    setLoading(false);
  }, [fromIso, toIso, selectedEventId]);

  const loadActivity = useCallback(async () => {
    setFeedLoading(true);

    const [tasksRes, reportsRes, contentRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, updated_at, created_by")
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("reports")
        .select("id, file_name, report_type, uploaded_at, uploaded_by")
        .order("uploaded_at", { ascending: false })
        .limit(20),
      supabase
        .from("content_library")
        .select("id, title, uploaded_at, uploaded_by")
        .order("uploaded_at", { ascending: false })
        .limit(20),
    ]);

    const userIds = new Set<string>();
    tasksRes.data?.forEach((t: any) => t.created_by && userIds.add(t.created_by));
    reportsRes.data?.forEach((r: any) => r.uploaded_by && userIds.add(r.uploaded_by));
    contentRes.data?.forEach((c: any) => c.uploaded_by && userIds.add(c.uploaded_by));

    let profilesMap: Record<string, { full_name: string | null; team: string | null }> = {};
    if (userIds.size) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, team")
        .in("id", Array.from(userIds));
      (profs ?? []).forEach((p: any) => {
        profilesMap[p.id] = { full_name: p.full_name, team: p.team };
      });
    }

    const items: ActivityItem[] = [
      ...(tasksRes.data ?? []).map((t: any) => ({
        id: t.id,
        kind: "task" as const,
        actorName: profilesMap[t.created_by]?.full_name ?? null,
        actorTeam: (profilesMap[t.created_by]?.team as Team) ?? null,
        text: `memperbarui tugas "${t.title}" → ${t.status}`,
        at: t.updated_at,
      })),
      ...(reportsRes.data ?? []).map((r: any) => ({
        id: r.id,
        kind: "report" as const,
        actorName: profilesMap[r.uploaded_by]?.full_name ?? null,
        actorTeam: (profilesMap[r.uploaded_by]?.team as Team) ?? null,
        text: `mengunggah laporan ${r.report_type ?? ""} ${r.file_name ?? ""}`.trim(),
        at: r.uploaded_at,
      })),
      ...(contentRes.data ?? []).map((c: any) => ({
        id: c.id,
        kind: "content" as const,
        actorName: profilesMap[c.uploaded_by]?.full_name ?? null,
        actorTeam: (profilesMap[c.uploaded_by]?.team as Team) ?? null,
        text: `mengunggah konten "${c.title ?? "Untitled"}"`,
        at: c.uploaded_at,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 20);

    setActivity(items);
    setFeedLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header + filter */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Pantau performa event dan tim secara real-time.
            </p>
          </div>
          <DateRangeFilter
            preset={preset}
            range={range}
            onChange={(p, r) => {
              setPreset(p);
              setRange(r);
            }}
          />
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Event Aktif"
            value={counts.activeEvents}
            icon={CalendarCheck}
            iconColorClass="bg-primary/10 text-primary"
            loading={loading}
          />
          <SummaryCard
            label="Total Tugas"
            value={counts.totalTasks}
            icon={ListChecks}
            iconColorClass="bg-team-social/10 text-team-social"
            loading={loading}
          >
            <div className="flex flex-wrap gap-1.5">
              <Badge color="bg-muted text-muted-foreground">
                Todo {counts.tasksByStatus.todo}
              </Badge>
              <Badge color="bg-primary/10 text-primary">
                Progress {counts.tasksByStatus.in_progress}
              </Badge>
              <Badge color="bg-team-marketing/10 text-team-marketing">
                Done {counts.tasksByStatus.done}
              </Badge>
            </div>
          </SummaryCard>
          <SummaryCard
            label="Total Laporan"
            value={counts.totalReports}
            icon={FileBarChart}
            iconColorClass="bg-team-marketing/10 text-team-marketing"
            loading={loading}
          />
          <SummaryCard
            label="Total Leads"
            value={counts.totalLeads}
            icon={Users}
            iconColorClass="bg-destructive/10 text-destructive"
            loading={loading}
          >
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-destructive">{counts.hotLeads}</span> hot leads
            </p>
          </SummaryCard>
        </div>

        {/* Body: events list + activity */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Event Aktif</h3>
              <span className="text-xs text-muted-foreground">{activeEventsList.length} event</span>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted/50" />
                ))}
              </div>
            ) : activeEventsList.length === 0 ? (
              <EmptyState canAdd={isManager} onAdd={() => setOpenAdd(true)} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {activeEventsList.map((e) => (
                  <EventProgressCard
                    key={e.id}
                    id={e.id}
                    title={e.title}
                    status={e.status}
                    startDate={e.start_date}
                    endDate={e.end_date}
                    progress={[
                      {
                        team: "advertising",
                        label: "Advertising",
                        uploaded: e.progress.find((p) => p.team === "advertising")?.uploaded ?? 0,
                        expected: EXPECTED_PER_TEAM,
                        colorClass: teamProgressColors.advertising,
                      },
                      {
                        team: "social_media",
                        label: "Social Media",
                        uploaded: e.progress.find((p) => p.team === "social_media")?.uploaded ?? 0,
                        expected: EXPECTED_PER_TEAM,
                        colorClass: teamProgressColors.social_media,
                      },
                      {
                        team: "marketing",
                        label: "Marketing",
                        uploaded: e.progress.find((p) => p.team === "marketing")?.uploaded ?? 0,
                        expected: EXPECTED_PER_TEAM,
                        colorClass: teamProgressColors.marketing,
                      },
                    ]}
                  />
                ))}
              </div>
            )}
          </div>

          <ActivityFeed items={activity} loading={feedLoading} />
        </div>
      </div>

      {/* Floating Add Event button */}
      {isManager && (
        <Button
          onClick={() => setOpenAdd(true)}
          className="fixed bottom-6 right-6 h-12 rounded-full px-5 shadow-lg shadow-primary/25 z-30"
          size="lg"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Tambah Event
        </Button>
      )}

      <AddEventSheet
        open={openAdd}
        onOpenChange={setOpenAdd}
        onCreated={() => {
          loadAll();
          loadActivity();
        }}
      />
    </AppShell>
  );
};

const Badge = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium", color)}>
    {children}
  </span>
);

const EmptyState = ({ canAdd, onAdd }: { canAdd: boolean; onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
      <CalendarRange className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="mt-4 text-base font-semibold">Belum ada event aktif</h3>
    <p className="mt-1 max-w-xs text-sm text-muted-foreground">
      Event aktif akan muncul di sini. Buat event baru untuk mulai melacak kemajuan tim.
    </p>
    {canAdd && (
      <Button onClick={onAdd} className="mt-5">
        <Plus className="mr-1.5 h-4 w-4" />
        Tambah Event
      </Button>
    )}
  </div>
);

export default Dashboard;
