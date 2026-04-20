import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud } from "lucide-react";
import FileDropzone from "./FileDropzone";
import { isAcceptedReport, sanitizeFilename } from "@/lib/reports";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  title: string;
  reportType: string;
  team: string;
  eventId: string | null;
  onUploaded?: () => void;
  pathPrefix: string; // e.g. "advertising"
}

export default function ReportUploadCard({
  title,
  reportType,
  team,
  eventId,
  onUploaded,
  pathPrefix,
}: Props) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !eventId || !user) {
      toast.error("Pilih event dan file terlebih dahulu");
      return;
    }
    setUploading(true);
    try {
      const safeName = `${Date.now()}-${sanitizeFilename(file.name)}`;
      const storagePath = `${pathPrefix}/${eventId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(storagePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("reports").insert({
        event_id: eventId,
        team,
        report_type: reportType,
        file_name: file.name,
        storage_path: storagePath,
        uploaded_by: user.id,
      });
      if (insertError) throw insertError;

      toast.success(`${title} berhasil diupload`);
      setFile(null);
      onUploaded?.();
    } catch (err: any) {
      toast.error(err.message ?? "Gagal mengupload laporan");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileDropzone
          accept=".csv,.xlsx,.xls"
          file={file}
          onFileChange={setFile}
          validate={(f) => (isAcceptedReport(f) ? null : "Format harus .csv atau .xlsx")}
          hint="CSV atau XLSX, maks 20MB"
          disabled={uploading || !eventId}
        />
        <Button
          onClick={handleUpload}
          disabled={!file || !eventId || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Mengupload...
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" /> Upload Laporan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
