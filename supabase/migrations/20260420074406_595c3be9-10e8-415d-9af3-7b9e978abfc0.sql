-- Create ad_campaigns table for manual Meta & Google Ads data entry
CREATE TABLE public.ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta_ads', 'google_ads')),
  campaign_name TEXT NOT NULL,
  daily_budget NUMERIC NOT NULL DEFAULT 0,
  total_spend NUMERIC NOT NULL DEFAULT 0,
  total_impressions BIGINT NOT NULL DEFAULT 0,
  cpm NUMERIC NOT NULL DEFAULT 0,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  cpc NUMERIC NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  landing_page_views BIGINT NOT NULL DEFAULT 0,
  cost_per_lpv NUMERIC NOT NULL DEFAULT 0,
  conv_rate NUMERIC NOT NULL DEFAULT 0,
  oclp NUMERIC NOT NULL DEFAULT 0,
  leads BIGINT NOT NULL DEFAULT 0,
  cost_per_lead NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Ad campaigns readable by authenticated"
ON public.ad_campaigns
FOR SELECT
TO authenticated
USING (true);

-- Only advertising team or events_manager can insert
CREATE POLICY "Ad campaigns insert by advertising or events manager"
ON public.ad_campaigns
FOR INSERT
TO authenticated
WITH CHECK (
  (created_by = auth.uid()) AND (
    public.get_user_team(auth.uid()) = 'advertising'
    OR public.get_user_role(auth.uid()) = 'events_manager'
  )
);

-- Update by creator or events_manager
CREATE POLICY "Ad campaigns update by creator or events manager"
ON public.ad_campaigns
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.get_user_role(auth.uid()) = 'events_manager'
);

-- Delete by creator or events_manager
CREATE POLICY "Ad campaigns delete by creator or events manager"
ON public.ad_campaigns
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.get_user_role(auth.uid()) = 'events_manager'
);

-- updated_at trigger
CREATE TRIGGER update_ad_campaigns_updated_at
BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX idx_ad_campaigns_event ON public.ad_campaigns(event_id);
CREATE INDEX idx_ad_campaigns_platform ON public.ad_campaigns(platform);
CREATE INDEX idx_ad_campaigns_created_at ON public.ad_campaigns(created_at DESC);