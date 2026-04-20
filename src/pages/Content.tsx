import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Download, Trash2, Play, FileText, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getContentKind, type ContentKind } from "@/lib/content";
import { getInitials } from "@/lib/teams";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UploadContentDialog from "@/components/content/UploadContentDialog";
import ImageLightbox from "@/components/content/ImageLightbox";
import VideoPlayerModal from "@/components/content/VideoPlayerModal";

interface ContentItem {
  id: string;
  title: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  file_type: string | null;
  storage_path: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  event_id: string | null;
  tags: string[] | null;
  events?: { title: string } | null;
  profiles?: { full_name: string | null } | null;
}

interface EventOption {
  id: string;
  title: string;
}

type TypeFilter = "all" | ContentKind;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
];

export default function Content() {
  const { profile, user } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<{ url: string; title: string | null } | null>(null);

  const canUpload =
    profile?.role_id === "events_manager" || profile?.team === "social_media";
  const canDelete = (item: ContentItem) =>
    profile?.role_id === "events_manager" || item.uploaded_by === user?.id;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title")
        .order("created_at", { ascending: false });
      setEvents((data as EventOption[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("content_library")
        .select(
          "id, title, file_url, thumbnail_url, file_type, storage_path, uploaded_at, uploaded_by, event_id, tags, events(title), profiles(full_name)"
        )
        .order("uploaded_at", { ascending: sort === "newest" });
      if (active) {
        setItems((data as any) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh, sort]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (search && !(i.title ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (eventFilter !== "all" && i.event_id !== eventFilter) return false;
      if (typeFilter !== "all" && getContentKind(i.file_type) !== typeFilter) return false;
      if (activeTags.length && !activeTags.every((t) => i.tags?.includes(t))) return false;
      return true;
    });
  }, [items, search, eventFilter, typeFilter, activeTags]);

  const imageItems = useMemo(
    () => filtered.filter((i) => getContentKind(i.file_type) === "image"),
    [filtered]
  );

  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`Hapus "${item.title ?? "konten"}"?`)) return;
    try {
      if (item.storage_path) {
        await supabase.storage.from("content-library").remove([item.storage_path]);
      }
      const { error } = await supabase.from("content_library").delete().eq("id", item.id);
      if (error) throw error;
      toast.success("Konten dihapus");
      setRefresh((r) => r + 1);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menghapus");
    }
  };

  const handleDownload = (item: ContentItem) => {
    if (!item.file_url) return;
    const a = document.createElement("a");
    a.href = item.file_url;
    a.download = item.title ?? "content";
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCardClick = (item: ContentItem) => {
    const kind = getContentKind(item.file_type);
    if (kind === "image" && item.file_url) {
      const idx = imageItems.findIndex((i) => i.id === item.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
    } else if (kind === "video" && item.file_url) {
      setVideoUrl({ url: item.file_url, title: item.title });
    } else if (item.file_url) {
      window.open(item.file_url, "_blank");
    }
  };

  const toggleTag = (t: string) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Konten</h1>
            <p className="mt-1 text-sm text-muted-foreground">Galeri konten tim</p>
          </div>
          {canUpload && (
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" /> Upload Konten
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan judul..."
                className="pl-9"
                maxLength={100}
              />
            </div>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Event" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Event</SelectItem>
                {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
              </SelectContent>
            </Select>

            {/* Segmented type filter */}
            <div className="inline-flex rounded-lg bg-muted p-1">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    typeFilter === t.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => {
                const on = activeTags.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    #{t}
                    {on && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Tidak ada konten yang cocok dengan filter
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const kind = getContentKind(item.file_type);
              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
                >
                  <div
                    className="relative aspect-video cursor-pointer overflow-hidden bg-muted"
                    onClick={() => handleCardClick(item)}
                  >
                    {kind === "image" && item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title ?? ""}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : kind === "video" ? (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/80 shadow-lg backdrop-blur">
                          <Play className="h-6 w-6 fill-foreground text-foreground" />
                        </div>
                      </div>
                    ) : kind === "document" ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <FileText className="h-14 w-14 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-14 w-14 text-muted-foreground" />
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 backdrop-blur"
                        onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canDelete(item) && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 p-3">
                    <p className="truncate text-sm font-medium">{item.title ?? "Tanpa judul"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                        {getInitials(item.profiles?.full_name)}
                      </div>
                      <span className="truncate">
                        {item.profiles?.full_name ?? "Unknown"} ·{" "}
                        {formatDistanceToNow(new Date(item.uploaded_at), { addSuffix: true, locale: idLocale })}
                      </span>
                    </div>
                    {item.events?.title && (
                      <Badge variant="outline" className="text-xs">
                        {item.events.title}
                      </Badge>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {canUpload && (
        <UploadContentDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          events={events}
          onUploaded={() => setRefresh((r) => r + 1)}
        />
      )}

      {lightboxIndex !== null && imageItems.length > 0 && (
        <ImageLightbox
          items={imageItems.map((i) => ({ url: i.file_url ?? "", title: i.title }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      <VideoPlayerModal
        open={!!videoUrl}
        url={videoUrl?.url ?? null}
        title={videoUrl?.title ?? null}
        onClose={() => setVideoUrl(null)}
      />
    </AppShell>
  );
}
