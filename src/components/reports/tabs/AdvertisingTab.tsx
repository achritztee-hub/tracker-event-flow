import { useState } from "react";
import EventSelector, { EventOption } from "../EventSelector";
import ReportUploadCard from "../ReportUploadCard";
import ReportHistoryTable from "../ReportHistoryTable";
import ManualCampaignDialog from "../ManualCampaignDialog";
import CampaignHistoryTable from "../CampaignHistoryTable";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  events: EventOption[];
  loadingEvents: boolean;
}

export default function AdvertisingTab({ events, loadingEvents }: Props) {
  const { profile } = useAuth();
  const [eventId, setEventId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [campaignRefresh, setCampaignRefresh] = useState(0);
  const bump = () => setRefresh((r) => r + 1);
  const bumpCampaigns = () => setCampaignRefresh((r) => r + 1);

  const canInputManual =
    profile?.team === "advertising" || profile?.role_id === "events_manager";

  return (
    <div className="space-y-6">
      <EventSelector events={events} value={eventId} onChange={setEventId} loading={loadingEvents} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <ReportUploadCard
            title="Meta Ads"
            reportType="meta_ads"
            team="advertising"
            eventId={eventId}
            pathPrefix="advertising"
            onUploaded={bump}
          />
          {canInputManual && (
            <div className="flex justify-end">
              <ManualCampaignDialog
                platform="meta_ads"
                platformLabel="Meta Ads"
                eventId={eventId}
                onSaved={bumpCampaigns}
              />
            </div>
          )}
        </div>
        <div className="space-y-3">
          <ReportUploadCard
            title="Google Ads"
            reportType="google_ads"
            team="advertising"
            eventId={eventId}
            pathPrefix="advertising"
            onUploaded={bump}
          />
          {canInputManual && (
            <div className="flex justify-end">
              <ManualCampaignDialog
                platform="google_ads"
                platformLabel="Google Ads"
                eventId={eventId}
                onSaved={bumpCampaigns}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Data Campaign Manual — Meta Ads</h3>
        <CampaignHistoryTable platform="meta_ads" refreshKey={campaignRefresh} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Data Campaign Manual — Google Ads</h3>
        <CampaignHistoryTable platform="google_ads" refreshKey={campaignRefresh} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Riwayat Upload File</h3>
        <ReportHistoryTable team="advertising" refreshKey={refresh} />
      </div>
    </div>
  );
}
