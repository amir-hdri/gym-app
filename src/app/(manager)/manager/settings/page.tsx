export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  let branch: any = null;
  try {
    branch = await prisma.branch.findFirst();
  } catch {}

  // Fallback default branch data for display
  const defaultBranch = branch || {
    name: "باشگاه ورزشی من",
    phone: "۰۲۱۱۲۳۴۵۶۷۸",
    address: "خیابان آزادی، پلاک ۴",
    city: "تهران",
    email: "manager@gym.com",
  };

  return <SettingsClient initialBranch={JSON.parse(JSON.stringify(defaultBranch))} />;
}
