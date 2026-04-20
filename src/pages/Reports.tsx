import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdvertisingTab from "@/components/reports/tabs/AdvertisingTab";
import SocialMediaTab from "@/components/reports/tabs/SocialMediaTab";
import MarketingTab from "@/components/reports/tabs/MarketingTab";
import type { EventOption } from "@/components/reports/EventSelector";
import { cn } from "@/lib/utils";

type TeamKey = "advertising" | "social_media" | "marketing";

const TAB_META: { key: TeamKey; label: string; activeClass: string }[] = [
  { key: "advertising", label: "Advertising", activeClass: "data-[state=active]:bg-team-advertising data-[state=active]:text-white" },
  { key: "social_media", label: "Social Media", activeClass: "data-[state=active]:bg-team-social data-[state=active]:text-white" },
  { key: "marketing", label: "Marketing", activeClass: "data-[state=active]:bg-team-marketing data-[state=active]:text-white" },
];

export default function Reports() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const visibleTabs = useMemo(() => {
    const role = profile?.role_id;
    const team = profile?.team as TeamKey | null;
    if (role === "events_manager") return TAB_META;
    if (!team) return [];
    return TAB_META.filter((t) => t.key === team);
  }, [profile]);

  const [active, setActive] = useState<TeamKey | null>(null);

  useEffect(() => {
    if (visibleTabs.length && !active) setActive(visibleTabs[0].key);
  }, [visibleTabs, active]);

  useEffect(() => {
    (async () => {
      setLoadingEvents(true);
      const { data } = await supabase
        .from("events")
        .select("id, title")
        .order("created_at", { ascending: false });
      setEvents((data as EventOption[]) ?? []);
      setLoadingEvents(false);
    })();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Upload dan kelola laporan tim</p>
        </div>

        {visibleTabs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Tim Anda tidak memiliki akses ke modul laporan.
          </div>
        ) : active ? (
          <Tabs value={active} onValueChange={(v) => setActive(v as TeamKey)}>
            <TabsList className="h-11 bg-muted p-1">
              {visibleTabs.map((t) => (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className={cn("px-4 transition-colors", t.activeClass)}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {visibleTabs.some((t) => t.key === "advertising") && (
              <TabsContent value="advertising" className="mt-6">
                <AdvertisingTab events={events} loadingEvents={loadingEvents} />
              </TabsContent>
            )}
            {visibleTabs.some((t) => t.key === "social_media") && (
              <TabsContent value="social_media" className="mt-6">
                <SocialMediaTab events={events} loadingEvents={loadingEvents} />
              </TabsContent>
            )}
            {visibleTabs.some((t) => t.key === "marketing") && (
              <TabsContent value="marketing" className="mt-6">
                <MarketingTab events={events} loadingEvents={loadingEvents} />
              </TabsContent>
            )}
          </Tabs>
        ) : null}
      </div>
    </AppShell>
  );
}
