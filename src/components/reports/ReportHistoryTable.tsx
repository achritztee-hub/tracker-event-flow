import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getSignedDownloadUrl } from "@/lib/reports";
import { toast } from "sonner";

interface ReportRow {
  id: string;
  file_name: string | null;
  storage_path: string | null;
  uploaded_at: string;
  row_count: number | null;
  event_id: string | null;
  events?: { title: string } | null;
}

interface Props {
  team: string;
  reportType?: string;
  refreshKey: number;
}

export default function ReportHistoryTable({ team, reportType, refreshKey }: Props) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      let query = supabase
        .from("reports")
        .select("id, file_name, storage_path, uploaded_at, row_count, event_id, events(title)")
        .eq("team", team)
        .order("uploaded_at", { ascending: false })
        .limit(50);
      if (reportType) query = query.eq("report_type", reportType);
      const { data } = await query;
      if (active) {
        setRows((data as any) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [team, reportType, refreshKey]);

  const handleDownload = async (path: string | null, name: string | null) => {
    if (!path) return;
    const url = await getSignedDownloadUrl("reports", path);
    if (!url) {
      toast.error("Gagal membuat link unduhan");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = name ?? "report";
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama File</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Tanggal Upload</TableHead>
            <TableHead>Jumlah Baris</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                Memuat...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                Belum ada laporan
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.file_name ?? "—"}</TableCell>
                <TableCell>{r.events?.title ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(r.uploaded_at), "dd MMM yyyy HH:mm", { locale: idLocale })}
                </TableCell>
                <TableCell>{r.row_count ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(r.storage_path, r.file_name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
