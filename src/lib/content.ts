export type ContentKind = "image" | "video" | "document" | "other";

export function getContentKind(fileType: string | null | undefined): ContentKind {
  if (!fileType) return "other";
  const t = fileType.toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.includes("pdf") || t.includes("word") || t.includes("document")) return "document";
  return "other";
}
