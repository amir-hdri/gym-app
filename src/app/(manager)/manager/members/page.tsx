import { listMembers } from "@/server/actions/members";
import MembersClient from "@/components/MembersClient";

export default async function MembersPage() {
  const members = JSON.parse(JSON.stringify(await listMembers()));

  return <MembersClient initialMembers={members} />;
}

