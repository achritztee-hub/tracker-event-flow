import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud } from "lucide-react";
import FileDropzone from "@/components/reports/FileDropzone";
import { sanitizeFilename } from "@/lib/reports";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EventOption {
  id: string;
  title: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EventOption[];
  onUploaded: () => void;
}

const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.pdf,.doc,.docx";

export default function UploadContentDialog({ open, onOpenChange, events, onUploaded }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState<string>("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setTitle("");
    setEventId("");
    setTags("");
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!user || !file || !title.trim() || !eventId) {
      toast.error("Lengkapi semua field");
      return;
    }
    setUploading(true);
    try {
      const safeName = `${Date.now()}-${sanitizeFilename(file.name)}`;
      const path = `content/${eventId}/${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("content-library")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("content-library").getPublicUrl(path);
      const isImage = file.type.startsWith("image/");

      const { error: insErr } = await supabase.from("content_library").insert({
        event_id: eventId,
        title: title.trim(),
        file_type: file.type,
        storage_path: path,
        file_url: pub.publicUrl,
        thumbnail_url: isImage ? pub.publicUrl : null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        uploaded_by: user.id,
      });
      if (insErr) throw insErr;

      toast.success("Konten berhasil diupload");
      reset();
      onUploaded();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal upload konten");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Konten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-title">Judul</Label>
            <Input
              id="ct-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Judul konten"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Event</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger><SelectValue placeholder="Pilih event" /></SelectTrigger>
              <SelectContent>
                {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-tags">Tags (pisahkan dengan koma)</Label>
            <Input
              id="ct-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="produk, promo"
            />
          </div>

          <FileDropzone
            accept={ACCEPT}
            file={file}
            onFileChange={setFile}
            hint="Image, video, atau document"
            disabled={uploading}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || !file || !title.trim() || !eventId}>
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Mengupload...</>
            ) : (
              <><UploadCloud className="h-4 w-4" /> Upload</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
