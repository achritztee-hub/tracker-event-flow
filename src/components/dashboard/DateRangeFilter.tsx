import { useState, useMemo } from "react";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type RangePreset = "today" | "week" | "month" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

interface Props {
  preset: RangePreset;
  range: DateRange;
  onChange: (preset: RangePreset, range: DateRange) => void;
}

const presets: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "custom", label: "Custom" },
];

export function getRangeForPreset(p: RangePreset, current?: DateRange): DateRange {
  const now = new Date();
  switch (p) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "week": return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month": return { from: startOfMonth(now), to: endOfMonth(now) };
    case "custom": return current ?? { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

const DateRangeFilter = ({ preset, range, onChange }: Props) => {
  const [customFrom, setCustomFrom] = useState<Date | undefined>(range.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(range.to);

  const handlePreset = (p: RangePreset) => {
    if (p === "custom") {
      onChange("custom", { from: customFrom ?? range.from, to: customTo ?? range.to });
    } else {
      onChange(p, getRangeForPreset(p));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-xl bg-muted p-1">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
              preset === p.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="font-normal">
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {customFrom ? format(customFrom, "d MMM yyyy") : "Dari"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={(d) => {
                  setCustomFrom(d);
                  if (d && customTo) onChange("custom", { from: startOfDay(d), to: endOfDay(customTo) });
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">—</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="font-normal">
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {customTo ? format(customTo, "d MMM yyyy") : "Sampai"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={(d) => {
                  setCustomTo(d);
                  if (d && customFrom) onChange("custom", { from: startOfDay(customFrom), to: endOfDay(d) });
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
