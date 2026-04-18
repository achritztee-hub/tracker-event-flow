import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/tasks": "Tugas",
  "/reports": "Laporan",
  "/content": "Konten",
  "/settings": "Pengaturan",
};

const AppShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = titles[location.pathname] ?? "Event Tracker";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full animate-fade-in">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border",
            "bg-background/70 backdrop-blur-xl px-4 md:px-8"
          )}
        >
          <div className="flex items-center gap-3">
            <button
              className="md:hidden rounded-md p-2 hover:bg-accent"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="text-sm text-muted-foreground hidden sm:block">{today}</div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
