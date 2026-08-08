export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import TrainersClient from "@/components/TrainersClient";

export default async function TrainersPage() {
  const staff = await prisma.staffProfile.findMany({
    include: {
      user: true,
      _count: {
        select: {
          trainerAssignments: { where: { active: true } },
          classes: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  // Fallback mock if no staff
  let displayTrainers = staff.map((s: any, idx: number) => {
    const colors = [
      { c: "rgba(16,185,129,.15)", t: "#34d399" },
      { c: "rgba(59,130,246,.15)", t: "#60a5fa" },
      { c: "rgba(168,85,247,.15)", t: "#c084fc" },
      { c: "rgba(34,211,238,.10)", t: "#22d3ee" },
    ];
    const theme = colors[idx % colors.length];
    return {
      id: s.id,
      name: s.user?.name || `مربی ${s.employeeCode}`,
      title: s.title || "مربی باشگاه",
      members: s._count?.trainerAssignments || 0,
      classes: s._count?.classes || 0,
      c: theme.c,
      t: theme.t,
      i: (s.user?.name || "م").substring(0,1),
      status: s.status,
      employeeCode: s.employeeCode,
      user: s.user,
    };
  });

  if (displayTrainers.length === 0) {
    // Show placeholder mock trainers for demo
    displayTrainers = [
      { id: "mock-1", name:"مربی علی", title:"یوگا و انعطاف‌پذیری", members:14, classes:3, c:"rgba(16,185,129,.15)",t:"#34d399", i:"ع", status: "ACTIVE", employeeCode: "STAFF-MOCK-1" },
      { id: "mock-2", name:"مربی سارا", title:"تمرینات HIIT و هوازی", members:9, classes:5, c:"rgba(59,130,246,.15)",t:"#60a5fa", i:"س", status: "ACTIVE", employeeCode: "STAFF-MOCK-2" },
      { id: "mock-3", name:"مربی رضا", title:"قدرتی و پاورلیفتینگ", members:11, classes:4, c:"rgba(168,85,247,.15)",t:"#c084fc", i:"ر", status: "ACTIVE", employeeCode: "STAFF-MOCK-3" },
      { id: "mock-4", name:"مربی مینا", title:"پیلاتس و مرکز بدن", members:7, classes:3, c:"rgba(34,211,238,.10)",t:"#22d3ee", i:"م", status: "ACTIVE", employeeCode: "STAFF-MOCK-4" },
    ] as any;
  }

  return <TrainersClient initialTrainers={JSON.parse(JSON.stringify(displayTrainers))} />;
}
