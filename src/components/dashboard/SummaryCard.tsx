import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColorClass?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

const SummaryCard = ({ label, value, icon: Icon, iconColorClass = "bg-primary/10 text-primary", loading, children }: SummaryCardProps) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl", iconColorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-4">
        <div className="text-3xl font-semibold tabular-nums tracking-tight">
          {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" /> : value}
        </div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
};

export default SummaryCard;
