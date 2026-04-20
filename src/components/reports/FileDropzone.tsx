import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/reports";
import { cn } from "@/lib/utils";

interface Props {
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  validate?: (file: File) => string | null;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export default function FileDropzone({
  accept,
  file,
  onFileChange,
  validate,
  label = "Tarik file ke sini, atau klik untuk pilih",
  hint,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    setError(null);
    if (!f) {
      onFileChange(null);
      return;
    }
    if (validate) {
      const err = validate(f);
      if (err) {
        setError(err);
        onFileChange(null);
        return;
      }
    }
    onFileChange(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0] ?? null;
    handleFile(f);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border bg-card/40 hover:bg-accent/40",
          disabled && "cursor-not-allowed opacity-60",
          !disabled && "cursor-pointer",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onSelect}
          className="hidden"
          disabled={disabled}
        />
        {file ? (
          <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-background/60 p-3">
            <div className="flex items-center gap-3 truncate">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="truncate text-left">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleFile(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">{label}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
