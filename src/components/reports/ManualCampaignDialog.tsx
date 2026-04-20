import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Platform = "meta_ads" | "google_ads";

interface Props {
  platform: Platform;
  platformLabel: string;
  eventId: string | null;
  onSaved?: () => void;
}

interface FormState {
  campaign_name: string;
  daily_budget: string;
  total_spend: string;
  total_impressions: string;
  cpm: string;
  total_clicks: string;
  cpc: string;
  ctr: string;
  landing_page_views: string;
  cost_per_lpv: string;
  conv_rate: string;
  oclp: string;
  leads: string;
  cost_per_lead: string;
  notes: string;
}

const EMPTY: FormState = {
  campaign_name: "",
  daily_budget: "",
  total_spend: "",
  total_impressions: "",
  cpm: "",
  total_clicks: "",
  cpc: "",
  ctr: "",
  landing_page_views: "",
  cost_per_lpv: "",
  conv_rate: "",
  oclp: "",
  leads: "",
  cost_per_lead: "",
  notes: "",
};

const num = (v: string) => {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export default function ManualCampaignDialog({ platform, platformLabel, eventId, onSaved }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!user) return;
    if (!eventId) {
      toast.error("Pilih event terlebih dahulu");
      return;
    }
    if (!form.campaign_name.trim()) {
      toast.error("Nama campaign wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("ad_campaigns").insert({
        event_id: eventId,
        platform,
        campaign_name: form.campaign_name.trim(),
        daily_budget: num(form.daily_budget),
        total_spend: num(form.total_spend),
        total_impressions: Math.trunc(num(form.total_impressions)),
        cpm: num(form.cpm),
        total_clicks: Math.trunc(num(form.total_clicks)),
        cpc: num(form.cpc),
        ctr: num(form.ctr),
        landing_page_views: Math.trunc(num(form.landing_page_views)),
        cost_per_lpv: num(form.cost_per_lpv),
        conv_rate: num(form.conv_rate),
        oclp: num(form.oclp),
        leads: Math.trunc(num(form.leads)),
        cost_per_lead: num(form.cost_per_lead),
        notes: form.notes.trim() || null,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success(`Data ${platformLabel} berhasil disimpan`);
      setForm(EMPTY);
      setOpen(false);
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message ?? "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!eventId} className="gap-2">
          <Plus className="h-4 w-4" /> Input Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Input Manual — {platformLabel}</DialogTitle>
          <DialogDescription>
            Isi data performa campaign secara manual. Field persentase pakai nilai % (cth: 2.5).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="campaign_name">Nama Campaign *</Label>
            <Input
              id="campaign_name"
              value={form.campaign_name}
              onChange={(e) => set("campaign_name", e.target.value)}
              placeholder="cth: Promo Event Jakarta - Mei"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Budget Harian (Rp)" id="daily_budget" value={form.daily_budget} onChange={(v) => set("daily_budget", v)} />
            <Field label="Total Spend (Rp)" id="total_spend" value={form.total_spend} onChange={(v) => set("total_spend", v)} />
            <Field label="Total Impresi" id="total_impressions" value={form.total_impressions} onChange={(v) => set("total_impressions", v)} />
            <Field label="CPM (Rp)" id="cpm" value={form.cpm} onChange={(v) => set("cpm", v)} />
            <Field label="Total Klik" id="total_clicks" value={form.total_clicks} onChange={(v) => set("total_clicks", v)} />
            <Field label="CPC (Rp)" id="cpc" value={form.cpc} onChange={(v) => set("cpc", v)} />
            <Field label="CTR (%)" id="ctr" value={form.ctr} onChange={(v) => set("ctr", v)} />
            <Field label="Landing Page Views" id="landing_page_views" value={form.landing_page_views} onChange={(v) => set("landing_page_views", v)} />
            <Field label="Cost / Landing Page View (Rp)" id="cost_per_lpv" value={form.cost_per_lpv} onChange={(v) => set("cost_per_lpv", v)} />
            <Field label="Conv. Rate (%)" id="conv_rate" value={form.conv_rate} onChange={(v) => set("conv_rate", v)} />
            <Field label="OCLP (%)" id="oclp" value={form.oclp} onChange={(v) => set("oclp", v)} />
            <Field label="Leads" id="leads" value={form.leads} onChange={(v) => set("leads", v)} />
            <Field label="Cost / Lead (Rp)" id="cost_per_lead" value={form.cost_per_lead} onChange={(v) => set("cost_per_lead", v)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Catatan tambahan..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              "Simpan Data"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    </div>
  );
}
