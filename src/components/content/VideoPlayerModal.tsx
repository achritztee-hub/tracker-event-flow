import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  url: string | null;
  title: string | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ open, url, title, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0">
        {url && (
          <video src={url} controls autoPlay className="aspect-video w-full rounded-lg bg-black" />
        )}
        {title && <p className="px-4 pb-4 text-sm text-muted-foreground">{title}</p>}
      </DialogContent>
    </Dialog>
  );
}
