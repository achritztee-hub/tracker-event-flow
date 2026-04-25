import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, CalendarRange } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EventOption = {
  id: string;
  title: string;
  status: string;
};

interface Props {
  value: string | null;
  onChange: (eventId: string | null) => void;
  /** if true, includes an "All events" option */
  allowAll?: boolean;
  /** filter to only active events. Defaults to true. */
  activeOnly?: boolean;
  className?: string;
}

const EventPicker = ({ value, onChange, allowAll = true, activeOnly = true, className }: Props) => {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("events")
        .select("id, title, status")
        .order("created_at", { ascending: false });
      if (activeOnly) query = query.eq("status", "active");
      const { data } = await query;
      setEvents((data as EventOption[]) ?? []);
      setLoading(false);
    })();
  }, [activeOnly]);

  const selected = events.find((e) => e.id === value);
  const label = selected ? selected.title : allowAll ? "Semua event" : "Pilih event";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          size="sm"
          className={cn("min-w-[200px] justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{loading ? "Memuat..." : label}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Cari event..." className="h-9" />
          <CommandList>
            <CommandEmpty>Tidak ada event.</CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem
                  value="__all__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  Semua event
                </CommandItem>
              )}
              {events.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.title} ${e.id}`}
                  onSelect={() => {
                    onChange(e.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === e.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{e.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EventPicker;
