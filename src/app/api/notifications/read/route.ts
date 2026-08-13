import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET() {
  return json({
    success: true,
    notifications: [
      { id: "1", title: "Streak reminder", body: "You’re on day 5.", read: false },
      { id: "2", title: "New course", body: "7 Days of Zen is ready.", read: false },
    ],
  });
}

export function POST() {
  return json({ success: true, marked: true });
}
