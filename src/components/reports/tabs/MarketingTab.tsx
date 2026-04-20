import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import EventSelector, { EventOption } from "../EventSelector";
import FileDropzone from "../FileDropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UploadCloud, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  isAcceptedReport,
  sanitizeFilename,
  validateLeadColumns,
  LEAD_REQUIRED_COLUMNS,
  statusDataBadgeClass,
  type LeadRow,
} from "@/lib/reports";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  events: EventOption[];
  loadingEvents: boolean;
}

interface LeadDB {
  id: string;
  date_received: string | null;
  name: string | null;
  domicile: string | null;
  profession: string | null;
  data_status: string | null;
  follow_up_status: string | null;
  payment_amount: number;
  event_id: string | null;
  events?: { title: string } | null;
}

function parseFileToRows(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const headers = (res.meta.fields ?? []).map((h) => h.trim());
          resolve({ headers, rows: res.data as Record<string, any>[] });
        },
        error: reject,
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array", cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
          const headers = json.length ? Object.keys(json[0]).map((h) => h.trim()) : [];
          resolve({ headers, rows: json });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    }
  });
}

function normalizeRow(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  Object.keys(row).forEach((k) => {
    out[k.trim().toLowerCase()] = row[k];
  });
  return out;
}

function toLeadRow(raw: Record<string, any>): LeadRow {
  const norm = normalizeRow(raw);
  return {
    tanggal_masuk: String(norm.tanggal_masuk ?? ""),
    nama: String(norm.nama ?? ""),
    domisili: String(norm.domisili ?? ""),
    profesi: String(norm.profesi ?? ""),
    status_data: String(norm.status_data ?? "").toLowerCase(),
    status_follow_up: String(norm.status_follow_up ?? ""),
    jumlah_bayar: Number(String(norm.jumlah_bayar ?? "0").replace(/[^\d.-]/g, "")) || 0,
  };
}

function parseDate(input: string): string | null {
  if (!input) return null;
  // Handle dd/mm/yyyy or yyyy-mm-dd
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export default function MarketingTab({ events, loadingEvents }: Props) {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [leads, setLeads] = useState<LeadDB[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [refresh, setRefresh] = useState(0);

  // Parse file when selected
  useEffect(() => {
    if (!file) {
      setHeaders([]);
      setParsedRows([]);
      setMissingCols([]);
      return;
    }
    setParsing(true);
    parseFileToRows(file)
      .then(({ headers, rows }) => {
        setHeaders(headers);
        setParsedRows(rows);
        setMissingCols(validateLeadColumns(headers));
      })
      .catch(() => toast.error("Gagal membaca file"))
      .finally(() => setParsing(false));
  }, [file]);

  // Fetch leads
  useEffect(() => {
    let active = true;
    (async () => {
      let q = supabase
        .from("leads")
        .select("id, date_received, name, domicile, profession, data_status, follow_up_status, payment_amount, event_id, events(title)")
        .order("date_received", { ascending: false })
        .limit(500);
      if (filterEvent !== "all") q = q.eq("event_id", filterEvent);
      if (filterStatus !== "all") q = q.eq("data_status", filterStatus);
      if (dateFrom) q = q.gte("date_received", dateFrom);
      if (dateTo) q = q.lte("date_received", dateTo);
      const { data } = await q;
      if (active) setLeads((data as any) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [refresh, filterEvent, filterStatus, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((l) => l.data_status?.toLowerCase() === "hot").length;
    const warm = leads.filter((l) => l.data_status?.toLowerCase() === "warm").length;
    const revenue = leads.reduce((s, l) => s + Number(l.payment_amount ?? 0), 0);
    return { total, hot, warm, revenue };
  }, [leads]);

  const previewRows = parsedRows.slice(0, 5);
  const canSubmit = file && eventId && missingCols.length === 0 && parsedRows.length > 0;

  const handleConfirm = async () => {
    if (!canSubmit || !user || !file || !eventId) return;
    setUploading(true);
    try {
      const safeName = `${Date.now()}-${sanitizeFilename(file.name)}`;
      const path = `marketing/${eventId}/${safeName}`;

      const { error: upErr } = await supabase.storage.from("reports").upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: report, error: reportErr } = await supabase
        .from("reports")
        .insert({
          event_id: eventId,
          team: "marketing",
          report_type: "leads",
          file_name: file.name,
          storage_path: path,
          row_count: parsedRows.length,
          uploaded_by: user.id,
        })
        .select("id")
        .single();
      if (reportErr) throw reportErr;

      const leadRows = parsedRows.map((raw) => {
        const lr = toLeadRow(raw);
        return {
          event_id: eventId,
          report_id: report.id,
          uploaded_by: user.id,
          date_received: parseDate(lr.tanggal_masuk),
          name: lr.nama || null,
          domicile: lr.domisili || null,
          profession: lr.profesi || null,
          data_status: lr.status_data || null,
          follow_up_status: lr.status_follow_up || null,
          payment_amount: lr.jumlah_bayar,
        };
      });

      // Insert in chunks of 500
      for (let i = 0; i < leadRows.length; i += 500) {
        const chunk = leadRows.slice(i, i + 500);
        const { error: insErr } = await supabase.from("leads").insert(chunk);
        if (insErr) throw insErr;
      }

      toast.success(`${leadRows.length} leads berhasil disimpan`);
      setFile(null);
      setRefresh((r) => r + 1);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menyimpan leads");
    } finally {
      setUploading(false);
    }
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <EventSelector events={events} value={eventId} onChange={setEventId} loading={loadingEvents} />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Upload Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropzone
            accept=".csv,.xlsx,.xls"
            file={file}
            onFileChange={setFile}
            validate={(f) => (isAcceptedReport(f) ? null : "Format harus .csv atau .xlsx")}
            hint={`Wajib kolom: ${LEAD_REQUIRED_COLUMNS.join(", ")}`}
            disabled={uploading || !eventId}
          />

          {parsing && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Membaca file...
            </p>
          )}

          {file && !parsing && missingCols.length > 0 && (
            <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Kolom wajib tidak ditemukan:</p>
                <p>{missingCols.join(", ")}</p>
              </div>
            </div>
          )}

          {file && !parsing && missingCols.length === 0 && previewRows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Preview 5 baris pertama dari {parsedRows.length} total baris
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {LEAD_REQUIRED_COLUMNS.map((c) => (
                        <TableHead key={c}>{c}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((r, i) => {
                      const lr = toLeadRow(r);
                      return (
                        <TableRow key={i}>
                          <TableCell>{lr.tanggal_masuk}</TableCell>
                          <TableCell>{lr.nama}</TableCell>
                          <TableCell>{lr.domisili}</TableCell>
                          <TableCell>{lr.profesi}</TableCell>
                          <TableCell>{lr.status_data}</TableCell>
                          <TableCell>{lr.status_follow_up}</TableCell>
                          <TableCell>{lr.jumlah_bayar}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <Button onClick={handleConfirm} disabled={!canSubmit || uploading} className="w-full">
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
            ) : (
              <><UploadCloud className="h-4 w-4" /> Konfirmasi & Upload</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryStat label="Total Leads" value={summary.total.toLocaleString("id-ID")} />
        <SummaryStat label="Hot Leads" value={summary.hot.toLocaleString("id-ID")} accent="text-destructive" />
        <SummaryStat label="Warm Leads" value={summary.warm.toLocaleString("id-ID")} accent="text-amber-500" />
        <SummaryStat label="Total Revenue" value={formatRupiah(summary.revenue)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Event</Label>
          <Select value={filterEvent} onValueChange={setFilterEvent}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Event</SelectItem>
              {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status Data</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Dari Tanggal</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sampai</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Domisili</TableHead>
              <TableHead>Profesi</TableHead>
              <TableHead>Status Data</TableHead>
              <TableHead>Follow Up</TableHead>
              <TableHead className="text-right">Jumlah Bayar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada leads
                </TableCell>
              </TableRow>
            ) : (
              leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground">
                    {l.date_received ? format(new Date(l.date_received), "dd MMM yyyy", { locale: idLocale }) : "—"}
                  </TableCell>
                  <TableCell className="font-medium">{l.name ?? "—"}</TableCell>
                  <TableCell>{l.domicile ?? "—"}</TableCell>
                  <TableCell>{l.profession ?? "—"}</TableCell>
                  <TableCell>
                    {l.data_status ? (
                      <Badge variant="outline" className={cn("border", statusDataBadgeClass(l.data_status))}>
                        {l.data_status}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{l.follow_up_status ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(Number(l.payment_amount))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight", accent)}>{value}</p>
    </div>
  );
}
