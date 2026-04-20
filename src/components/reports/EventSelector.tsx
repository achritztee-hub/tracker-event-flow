import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface EventOption {
  id: string;
  title: string;
}

interface Props {
  events: EventOption[];
  value: string | null;
  onChange: (value: string) => void;
  loading?: boolean;
}

export default function EventSelector({ events, value, onChange, loading }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Pilih Event</Label>
      <Select value={value ?? undefined} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder={loading ? "Memuat event..." : "Pilih event terlebih dahulu"} />
        </SelectTrigger>
        <SelectContent>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.title}
            </SelectItem>
          ))}
          {events.length === 0 && !loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Belum ada event</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
