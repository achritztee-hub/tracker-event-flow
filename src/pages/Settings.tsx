import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Camera, Info, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { getInitials, teamColorClass, Team, teamLabels } from "@/lib/teams";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ChangePasswordDialog from "@/components/settings/ChangePasswordDialog";
import { Language } from "@/lib/i18n";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (v: T) => void;
}) => (
  <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
          value === opt.value
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border bg-card p-6">
    <div className="mb-5">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </section>
);

const Settings = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    (profile as any)?.avatar_url ?? null
  );
  const [passwordOpen, setPasswordOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAvatarUrl((profile as any)?.avatar_url ?? null);
  }, [profile]);

  const team = (profile?.team as Team) ?? "management";
  const roleDisplay =
    profile?.role_id?.split("_").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ") ?? "—";

  const handleSaveName = async () => {
    if (!user) return;
    const trimmed = fullName.trim();
    if (!trimmed || trimmed.length > 100) {
      toast.error("Nama tidak valid");
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("settings.profile.saved"));
      await refreshProfile();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran maksimal 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url } as any)
        .eq("id", user.id);
      if (updateError) throw updateError;

      setAvatarUrl(url);
      toast.success(t("settings.profile.avatarSaved"));
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || t("settings.profile.avatarError"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        {/* Profil */}
        <Section title={t("settings.profile")} description={t("settings.profile.desc")}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className={cn(
                  "group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-semibold text-white transition-opacity",
                  !avatarUrl && teamColorClass[team],
                  uploadingAvatar && "opacity-60"
                )}
                aria-label={t("settings.profile.uploadAvatar")}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span>{getInitials(profile?.full_name)}</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <span className="text-xs text-muted-foreground">
                {uploadingAvatar ? t("common.uploading") : t("settings.profile.uploadAvatar")}
              </span>
            </div>

            {/* Form */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("settings.profile.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("settings.profile.email")}</Label>
                  <Input value={profile?.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.profile.team")}</Label>
                  <Input value={teamLabels[team]} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  {t("settings.profile.role")}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{t("settings.profile.roleTooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div>
                  <Badge variant="secondary" className="text-sm">
                    {roleDisplay}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={handleSaveName}
                disabled={savingProfile || fullName.trim() === (profile?.full_name ?? "")}
              >
                {savingProfile ? t("common.saving") : t("settings.profile.save")}
              </Button>
            </div>
          </div>
        </Section>

        {/* Tampilan */}
        <Section title={t("settings.appearance")} description={t("settings.appearance.desc")}>
          <Segmented<Theme>
            value={theme}
            onChange={(v) => setTheme(v)}
            options={[
              { value: "dark", label: t("settings.appearance.dark") },
              { value: "light", label: t("settings.appearance.light") },
              { value: "system", label: t("settings.appearance.system") },
            ]}
          />
        </Section>

        {/* Bahasa */}
        <Section title={t("settings.language")} description={t("settings.language.desc")}>
          <Segmented<Language>
            value={language}
            onChange={(v) => setLanguage(v)}
            options={[
              { value: "id", label: t("settings.language.id") },
              { value: "en", label: t("settings.language.en") },
            ]}
          />
        </Section>

        {/* Keamanan */}
        <Section title={t("settings.security")} description={t("settings.security.desc")}>
          <Button variant="outline" onClick={() => setPasswordOpen(true)}>
            {t("settings.security.changePassword")}
          </Button>
        </Section>
      </div>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </AppShell>
  );
};

export default Settings;
