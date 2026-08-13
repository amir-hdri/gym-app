import { json } from "@/lib/api";
import { generateSecureQrToken } from "@/lib/qr";

export const dynamic = "force-dynamic";

export function GET() {
  const token = generateSecureQrToken("MEM-001", "prof-mem-1", "ENTRY");
  return json({
    success: true,
    token,
    membershipCode: "MEM-001",
    type: "ENTRY",
    expiresInSeconds: 120,
  });
}

export const POST = GET;
