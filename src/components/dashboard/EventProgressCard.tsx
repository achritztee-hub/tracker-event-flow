import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type EventStatus = "upcoming" | "active" | "completed";

interface TeamProgress {
  team: "advertising" | "social_media" | "marketing";
  label: string;
  uploaded: number;
  expected: number;
  colorClass: string; // bg color for fill
}

interface Props {
  id: string;
  title: string;
  status: EventStatus;
  startDate: string | null;
  endDate: string | null;
  progress: TeamProgress[];
}

const statusStyles: Record<EventStatus, string> = {
  active: "bg-primary/15 text-primary",
  completed: "bg-team-marketing/15 text-team-marketing",
  upcoming: "bg-muted text-muted-foreground",
};

const statusLabels: Record<EventStatus, string> = {
  active: "Active",
  completed: "Completed",
  upcoming: "Upcoming",
};

const formatRange = (s: string | null, e: string | null) => {
  if (!s && !e) return "—";
  const fmt = (d: string) => format(new Date(d), "d MMM");
  if (s && e) return `${fmt(s)} – ${fmt(e)}`;
  return fmt((s ?? e) as string);
};

const EventProgressCard = ({ id, title, status, startDate, endDate, progress }: Props) => {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">{title}</h3>
          <div className="mt-1 text-xs text-muted-foreground">{formatRange(startDate, endDate)}</div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", statusStyles[status])}>
          {statusLabels[status]}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {progress.map((p) => {
          const pct = p.expected > 0 ? Math.min(100, Math.round((p.uploaded / p.expected) * 100)) : 0;
          return (
            <div key={p.team}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-foreground">{p.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {p.uploaded}/{p.expected}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", p.colorClass)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to={`/events/${id}`}
        className="absolute right-4 bottom-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
      >
        Lihat Detail <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
};

export default EventProgressCard;
