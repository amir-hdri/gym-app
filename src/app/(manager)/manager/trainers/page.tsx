export const dynamic = "force-dynamic";

import { listTrainers, getAllMembersForAssignment } from "@/server/actions/trainers";
import TrainersClient from "@/components/TrainersClient";

export default async function TrainersPage() {
  const [trainers, allMembers] = await Promise.all([
    listTrainers(),
    getAllMembersForAssignment(),
  ]);

  return (
    <TrainersClient
      initialTrainers={JSON.parse(JSON.stringify(trainers))}
      allMembers={JSON.parse(JSON.stringify(allMembers))}
    />
  );
}
