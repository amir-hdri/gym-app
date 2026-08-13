export type SessionItem = {
  id: string;
  title: string;
  meta: string;
  kind: "meditation" | "sleep" | "music" | "course";
  minutes: number;
  icon: "head" | "sun" | "wave" | "note";
  blurb?: string;
};

export const sessions: SessionItem[] = [
  {
    id: "letting-go",
    title: "The Art of Letting Go",
    meta: "15 min · Sleep",
    kind: "sleep",
    minutes: 15,
    icon: "wave",
    blurb: "Release the mental weight of the day and prepare for deep rest.",
  },
  {
    id: "anxiety",
    title: "Anxiety Relief",
    meta: "10 min · Guided",
    kind: "meditation",
    minutes: 10,
    icon: "head",
    blurb: "A short sit to settle racing thoughts.",
  },
  {
    id: "morning",
    title: "Morning Energy",
    meta: "5 min · Visualization",
    kind: "meditation",
    minutes: 5,
    icon: "sun",
    blurb: "Open the day with light and intention.",
  },
  {
    id: "ocean",
    title: "Deep Ocean Sleep",
    meta: "22 min · Story",
    kind: "sleep",
    minutes: 22,
    icon: "wave",
    blurb: "Drift under a slow tide of spoken story.",
  },
  {
    id: "rain",
    title: "Soft Night Rain",
    meta: "45 min · Music",
    kind: "music",
    minutes: 45,
    icon: "note",
    blurb: "A bed of rain for reading or rest.",
  },
  {
    id: "wind",
    title: "Temple Wind",
    meta: "30 min · Music",
    kind: "music",
    minutes: 30,
    icon: "note",
    blurb: "Air through cedar and distant bells.",
  },
  {
    id: "zen",
    title: "Mastering Stillness",
    meta: "7 days · Course",
    kind: "course",
    minutes: 12,
    icon: "head",
    blurb: "Seven evenings of quiet practice.",
  },
  {
    id: "stress",
    title: "Release the Day",
    meta: "12 min · Guided",
    kind: "meditation",
    minutes: 12,
    icon: "head",
    blurb: "Unclench the jaw, drop the shoulders.",
  },
  {
    id: "focus",
    title: "Single Point",
    meta: "8 min · Focus",
    kind: "meditation",
    minutes: 8,
    icon: "sun",
    blurb: "One object. One breath. Return.",
  },
];

export function resolveSession(raw: string | null | undefined): SessionItem {
  if (!raw) return sessions[0];
  const decoded = decodeURIComponent(raw);
  return (
    sessions.find((s) => s.id === decoded || s.title.toLowerCase() === decoded.toLowerCase()) || {
      ...sessions[0],
      id: decoded,
      title: decoded.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  );
}

export function iconPath(icon: SessionItem["icon"]) {
  if (icon === "sun") return "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2 12h2M20 12h2";
  if (icon === "note") return "M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z";
  if (icon === "wave") return "M3 14c3.5-6 7-6 9 0 2 6 5.5 6 9 0";
  return "M4 12v2a4 4 0 0 0 8 0v-2M12 12v2a4 4 0 0 0 8 0v-2M4 12V9a8 8 0 0 1 16 0v3";
}
