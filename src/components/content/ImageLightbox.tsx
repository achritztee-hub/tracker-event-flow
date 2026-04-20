import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LightboxItem {
  url: string;
  title: string | null;
}

interface Props {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export default function ImageLightbox({ items, index, onClose, onIndexChange }: Props) {
  const current = items[index];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && index < items.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, items.length, onClose, onIndexChange]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-4 top-4 text-white hover:bg-white/10 hover:text-white"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {index > 0 && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute left-4 text-white hover:bg-white/10 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index - 1);
          }}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {index < items.length - 1 && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-4 text-white hover:bg-white/10 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index + 1);
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <img src={current.url} alt={current.title ?? ""} className="max-h-[90vh] max-w-[90vw] object-contain" />
        {current.title && (
          <p className="mt-3 text-center text-sm text-white/80">{current.title}</p>
        )}
      </div>
    </div>
  );
}
