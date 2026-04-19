import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { teamLabels, type Team } from "@/lib/teams";
import { toast } from "sonner";
import type { EventLite, ProfileLite } from "./types";

const schema = z.object({
  title: z.string().trim().min(2, "Minimal 2 karakter").max(160),
  description: z.string().trim().max(2000).optional(),
  event_id: z.string().optional(),
  assigned_team: z.enum(["advertising", "social_media", "marketing"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.date().optional(),
  assigned_to: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const TEAM_OPTIONS: Team[] = ["advertising", "social_media", "marketing"];

const AddTaskDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [members, setMembers] = useState<ProfileLite[]>([]);

  const {
    register, handleSubmit, control, reset, watch, setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium", assigned_to: [] },
  });

  const selectedTeam = watch("assigned_team");
  const selectedAssignees = watch("assigned_to") ?? [];
  const dueDate = watch("due_date");

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const [{ data: ev }, { data: pf }] = await Promise.all([
        supabase.from("events").select("id,title,status").in("status", ["active", "upcoming"]).order("start_date", { ascending: true }),
        supabase.from("profiles").select("id,full_name,team"),
      ]);
      setEvents((ev as EventLite[]) ?? []);
      setMembers((pf as ProfileLite[]) ?? []);
    };
    load();
  }, [open]);

  // Reset assignees when team changes
  useEffect(() => {
    setValue("assigned_to", []);
  }, [selectedTeam, setValue]);

  const teamMembers = members.filter((m) => m.team === selectedTeam);

  const toggleAssignee = (id: string) => {
    const current = selectedAssignees;
    setValue(
      "assigned_to",
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      { shouldValidate: true },
    );
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("tasks").insert({
      title: values.title,
      description: values.description || null,
      event_id: values.event_id || null,
      assigned_team: values.assigned_team,
      assigned_to: values.assigned_to.length ? values.assigned_to : null,
      priority: values.priority,
      due_date: values.due_date ? format(values.due_date, "yyyy-MM-dd") : null,
      status: "todo",
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tugas berhasil dibuat");
    reset({ priority: "medium", assigned_to: [] });
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Tugas</DialogTitle>
          <DialogDescription>Buat tugas baru untuk tim Anda.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Event</Label>
              <Controller
                control={control}
                name="event_id"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Pilih event" /></SelectTrigger>
                    <SelectContent>
                      {events.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Tim</Label>
              <Controller
                control={control}
                name="assigned_team"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Pilih tim" /></SelectTrigger>
                    <SelectContent>
                      {TEAM_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{teamLabels[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assigned_team && <p className="text-xs text-destructive">Pilih tim</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prioritas</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start font-normal", !dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "d MMM yyyy") : "Pilih"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => d && setValue("due_date", d, { shouldValidate: true })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedTeam && (
            <div className="space-y-2">
              <Label>Anggota ({selectedAssignees.length})</Label>
              <div className="rounded-md border border-border max-h-40 overflow-y-auto p-1">
                {teamMembers.length === 0 && (
                  <p className="px-2 py-3 text-xs text-muted-foreground">Tidak ada anggota di tim ini</p>
                )}
                {teamMembers.map((m) => {
                  const checked = selectedAssignees.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                        checked && "bg-primary/10",
                      )}
                    >
                      <span>{m.full_name ?? "Unnamed"}</span>
                      {checked && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Tugas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
