export type Team = "advertising" | "social_media" | "marketing" | "management";

export const teamLabels: Record<Team, string> = {
  advertising: "Advertising",
  social_media: "Social Media",
  marketing: "Marketing",
  management: "Management",
};

export const teamColorClass: Record<Team, string> = {
  advertising: "bg-team-advertising",
  social_media: "bg-team-social",
  marketing: "bg-team-marketing",
  management: "bg-team-management",
};

export const teamTextClass: Record<Team, string> = {
  advertising: "text-team-advertising",
  social_media: "text-team-social",
  marketing: "text-team-marketing",
  management: "text-team-management",
};

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
