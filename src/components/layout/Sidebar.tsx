import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListChecks, FileBarChart, Image as ImageIcon, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/i18n";
import { getInitials, teamColorClass, Team, teamLabels } from "@/lib/teams";
import { cn } from "@/lib/utils";

const nav: { to: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }[] = [
  { to: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard },
  { to: "/tasks", labelKey: "nav.tasks", icon: ListChecks },
  { to: "/reports", labelKey: "nav.reports", icon: FileBarChart },
  { to: "/content", labelKey: "nav.content", icon: ImageIcon },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

interface Props {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: Props) => {
  const { profile, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const team = (profile?.team as Team) ?? "management";
  const avatarUrl = (profile as any)?.avatar_url as string | null | undefined;
  const roleDisplay = profile?.role_id?.split("_").map(s => s[0].toUpperCase() + s.slice(1)).join(" ") ?? "—";

  return (
    <aside className="glass-sidebar flex h-full w-[220px] flex-col border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            E
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Event Tracker</div>
            <div className="text-[11px] text-muted-foreground">Internal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>

      {/* User pill */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
              teamColorClass[team]
            )}
          >
            {getInitials(profile?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-sidebar-foreground">
              {profile?.full_name ?? "User"}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {roleDisplay} · {teamLabels[team]}
            </div>
          </div>
          <button
            onClick={signOut}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
