import { useEffect, useState } from "react";
import EventSelector, { EventOption } from "../EventSelector";
import ReportUploadCard from "../ReportUploadCard";
import ReportHistoryTable from "../ReportHistoryTable";
import FileDropzone from "../FileDropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeFilename } from "@/lib/reports";

interface Props {
  events: EventOption[];
  loadingEvents: boolean;
}

const CONTENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.mp4,.pdf";

interface ContentRow {
  id: string;
  title: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  file_type: string | null;
  uploaded_at: string;
  tags: string[] | null;
}

export default function SocialMediaTab({ events, loadingEvents }: Props) {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  // Content upload state
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [contentItems, setContentItems] = useState<ContentRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("content_library")
        .select("id, title, file_url, thumbnail_url, file_type, uploaded_at, tags")
        .order("uploaded_at", { ascending: false })
        .limit(12);
      setContentItems((data as any) ?? []);
    })();
  }, [refresh]);

  const handleContentUpload = async () => {
    if (!contentFile || !eventId || !user || !title.trim()) {
      toast.error("Pilih event, isi judul, dan pilih file");
      return;
    }
    setUploading(true);
    try {
      const safeName = `${Date.now()}-${sanitizeFilename(contentFile.name)}`;
      const path = `${eventId}/${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("content-library")
        .upload(path, contentFile, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("content-library").getPublicUrl(path);

      const isImage = contentFile.type.startsWith("image/");

      const { error: insErr } = await supabase.from("content_library").insert({
        event_id: eventId,
        title: title.trim(),
        file_type: contentFile.type,
        storage_path: path,
        file_url: pub.publicUrl,
        thumbnail_url: isImage ? pub.publicUrl : null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        uploaded_by: user.id,
      });
      if (insErr) throw insErr;

      toast.success("Konten berhasil diupload");
      setContentFile(null);
      setTitle("");
      setTags("");
      setRefresh((r) => r + 1);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal upload konten");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <EventSelector events={events} value={eventId} onChange={setEventId} loading={loadingEvents} />

      <div className="grid gap-4 md:grid-cols-2">
        <ReportUploadCard
          title="Laporan Konten"
          reportType="social_content"
          team="social_media"
          eventId={eventId}
          pathPrefix="social_media"
          onUploaded={() => setRefresh((r) => r + 1)}
        />

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Upload Konten ke Library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="content-title" className="text-xs">Judul</Label>
              <Input
                id="content-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul konten"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content-tags" className="text-xs">Tags (pisahkan dengan koma)</Label>
              <Input
                id="content-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="produk, promo, video"
              />
            </div>
            <FileDropzone
              accept={CONTENT_ACCEPT}
              file={contentFile}
              onFileChange={setContentFile}
              hint="JPG, PNG, WEBP, MP4, atau PDF"
              disabled={uploading || !eventId}
            />
            {contentFile && contentFile.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(contentFile)}
                alt="preview"
                className="h-32 w-full rounded-lg object-cover"
              />
            )}
            <Button
              onClick={handleContentUpload}
              disabled={!contentFile || !eventId || !title.trim() || uploading}
              className="w-full"
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Mengupload...</>
              ) : (
                <><UploadCloud className="h-4 w-4" /> Upload Konten</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Riwayat Laporan</h3>
        <ReportHistoryTable team="social_media" refreshKey={refresh} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">Konten Terbaru</h3>
        {contentItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada konten
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {contentItems.map((c) => (
              <a
                key={c.id}
                href={c.file_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-xl border border-border bg-card"
              >
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title ?? "konten"}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">
                    {c.file_type?.split("/")[1]?.toUpperCase() ?? "FILE"}
                  </div>
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{c.title ?? "Tanpa judul"}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
