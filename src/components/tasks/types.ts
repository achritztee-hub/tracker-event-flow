import type { Tables } from "@/integrations/supabase/types";

export type TaskRow = Tables<"tasks">;
export type EventLite = { id: string; title: string; status: string };
export type ProfileLite = { id: string; full_name: string | null; team: string | null };
