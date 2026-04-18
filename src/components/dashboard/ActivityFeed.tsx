import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getInitials, teamColorClass, Team } from "@/lib/teams";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  kind: "task" | "report" | "content";
  actorName: string | null;
  actorTeam: Team | null;
  text: string;
  at: string; // ISO
}

interface Props {
  items: ActivityItem[];
  loading?: boolean;
}

const kindLabel: Record<ActivityItem["kind"], string> = {
  task: "Tugas",
  report: "Laporan",
  content: "Konten",
};

const ActivityFeed = ({ items, loading }: Props) => {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">Aktivitas Terbaru</h3>
        <span className="text-[11px] text-muted-foreground">{items.length}</span>
      </div>
      <div className="max-h-[640px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-2 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-muted-foreground">
            Belum ada aktivitas.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => {
              const team = it.actorTeam ?? "management";
              return (
                <li key={`${it.kind}-${it.id}`} className="flex gap-3 px-5 py-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                      teamColorClass[team as Team]
                    )}
                  >
                    {getInitials(it.actorName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug text-foreground">
                      <span className="font-medium">{it.actorName ?? "Seseorang"}</span>{" "}
                      <span className="text-muted-foreground">{it.text}</span>
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">{kindLabel[it.kind]}</span>
                      <span>
                        {formatDistanceToNow(new Date(it.at), { addSuffix: true, locale: idLocale })}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
