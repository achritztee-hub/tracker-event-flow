import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Campaign {
  id: string;
  campaign_name: string;
  event_id: string | null;
  daily_budget: number;
  total_spend: number;
  total_impressions: number;
  cpm: number;
  total_clicks: number;
  cpc: number;
  ctr: number;
  landing_page_views: number;
  cost_per_lpv: number;
  conv_rate: number;
  oclp: number;
  leads: number;
  cost_per_lead: number;
  created_at: string;
  created_by: string | null;
  events?: { title: string | null } | null;
}

interface Props {
  platform: "meta_ads" | "google_ads";
  refreshKey: number;
  onChanged?: () => void;
}

const fmtNum = (n: number) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);
const fmtPct = (n: number) => `${(n ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default function CampaignHistoryTable({ platform, refreshKey, onChanged }: Props) {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*, events(title)")
        .eq("platform", platform)
        .order("created_at", { ascending: false });
      if (!error) setRows((data as unknown as Campaign[]) ?? []);
      setLoading(false);
    })();
  }, [platform, refreshKey]);

  const canDelete = (row: Campaign) =>
    row.created_by === user?.id || profile?.role_id === "events_manager";

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data campaign ini?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Data dihapus");
    setRows((r) => r.filter((x) => x.id !== id));
    onChanged?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border p-10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat data...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Belum ada data campaign manual.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="text-right">Budget/hari</TableHead>
            <TableHead className="text-right">Spend</TableHead>
            <TableHead className="text-right">Impresi</TableHead>
            <TableHead className="text-right">CPM</TableHead>
            <TableHead className="text-right">Klik</TableHead>
            <TableHead className="text-right">CPC</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">LPV</TableHead>
            <TableHead className="text-right">Cost/LPV</TableHead>
            <TableHead className="text-right">Conv. Rate</TableHead>
            <TableHead className="text-right">OCLP</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Cost/Lead</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.campaign_name}</TableCell>
              <TableCell className="text-muted-foreground">{r.events?.title ?? "—"}</TableCell>
              <TableCell className="text-right">{fmtRp(r.daily_budget)}</TableCell>
              <TableCell className="text-right">{fmtRp(r.total_spend)}</TableCell>
              <TableCell className="text-right">{fmtNum(r.total_impressions)}</TableCell>
              <TableCell className="text-right">{fmtRp(r.cpm)}</TableCell>
              <TableCell className="text-right">{fmtNum(r.total_clicks)}</TableCell>
              <TableCell className="text-right">{fmtRp(r.cpc)}</TableCell>
              <TableCell className="text-right">{fmtPct(r.ctr)}</TableCell>
              <TableCell className="text-right">{fmtNum(r.landing_page_views)}</TableCell>
              <TableCell className="text-right">{fmtRp(r.cost_per_lpv)}</TableCell>
              <TableCell className="text-right">{fmtPct(r.conv_rate)}</TableCell>
              <TableCell className="text-right">{fmtPct(r.oclp)}</TableCell>
              <TableCell className="text-right">{fmtNum(r.leads)}</TableCell>
              <TableCell className="text-right">{fmtRp(r.cost_per_lead)}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
              <TableCell>
                {canDelete(r) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
