import { supabase } from "@/integrations/supabase/client";

export const ACCEPTED_REPORT_EXT = [".csv", ".xlsx", ".xls"];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isAcceptedReport(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_REPORT_EXT.some((ext) => name.endsWith(ext));
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_");
}

export async function getSignedDownloadUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export const LEAD_REQUIRED_COLUMNS = [
  "tanggal_masuk",
  "nama",
  "domisili",
  "profesi",
  "status_data",
  "status_follow_up",
  "jumlah_bayar",
] as const;

export type LeadRow = {
  tanggal_masuk: string;
  nama: string;
  domisili: string;
  profesi: string;
  status_data: string;
  status_follow_up: string;
  jumlah_bayar: number;
};

export function validateLeadColumns(headers: string[]): string[] {
  const lower = headers.map((h) => h.trim().toLowerCase());
  return LEAD_REQUIRED_COLUMNS.filter((col) => !lower.includes(col));
}

export function statusDataBadgeClass(status: string | null | undefined): string {
  switch ((status ?? "").toLowerCase()) {
    case "hot":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "warm":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "cold":
      return "bg-primary/15 text-primary border-primary/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
