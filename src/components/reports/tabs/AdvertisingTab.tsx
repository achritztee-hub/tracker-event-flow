import { useState } from "react";
import EventSelector, { EventOption } from "../EventSelector";
import ReportUploadCard from "../ReportUploadCard";
import ReportHistoryTable from "../ReportHistoryTable";

interface Props {
  events: EventOption[];
  loadingEvents: boolean;
}

export default function AdvertisingTab({ events, loadingEvents }: Props) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const bump = () => setRefresh((r) => r + 1);

  return (
    <div className="space-y-6">
      <EventSelector events={events} value={eventId} onChange={setEventId} loading={loadingEvents} />

      <div className="grid gap-4 md:grid-cols-2">
        <ReportUploadCard
          title="Meta Ads"
          reportType="meta_ads"
          team="advertising"
          eventId={eventId}
          pathPrefix="advertising"
          onUploaded={bump}
        />
        <ReportUploadCard
          title="Google Ads"
          reportType="google_ads"
          team="advertising"
          eventId={eventId}
          pathPrefix="advertising"
          onUploaded={bump}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Riwayat Upload</h3>
        <ReportHistoryTable team="advertising" refreshKey={refresh} />
      </div>
    </div>
  );
}
