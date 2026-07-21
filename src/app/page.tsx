import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  const role = (session.user as any).role;
  if (role === "MEMBER") {
    redirect("/member/dashboard");
  } else {
    redirect("/manager/dashboard");
  }
}
