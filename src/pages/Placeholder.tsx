import AppShell from "@/components/layout/AppShell";

interface Props {
  title: string;
  description?: string;
}

const Placeholder = ({ title, description }: Props) => (
  <AppShell>
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {description ?? "Konten halaman ini akan dibangun selanjutnya."}
      </p>
    </div>
  </AppShell>
);

export default Placeholder;
