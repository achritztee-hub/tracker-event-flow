import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { profile } = useAuth();
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Halo, {profile?.full_name ?? "—"} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang di workspace tim. Konten dashboard akan segera hadir.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Events aktif", "Tugas tertunda", "Laporan minggu ini"].map((label) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-3 text-3xl font-semibold tabular-nums">—</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
