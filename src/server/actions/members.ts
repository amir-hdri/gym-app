"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createMemberSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6).default("changeme"),
});

export async function createMember(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || undefined,
    password: (formData.get("password") as string) || "changeme",
  };

  const data = createMemberSchema.parse(raw);
  const passwordHash = await bcrypt.hash(data.password, 12);

  const membershipCode = "MEM-" + Date.now().toString(36).toUpperCase();

  return prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      passwordHash,
      role: "MEMBER",
      memberProfile: {
        create: { membershipCode },
      },
    },
  });
}

export async function listMembers() {
  return prisma.user.findMany({
    where: { role: "MEMBER" },
    include: {
      memberProfile: {
        include: {
          subscriptions: {
            include: { plan: true, payments: true },
            orderBy: { createdAt: "desc" },
          },
          workoutRoutines: {
            where: { isActive: true },
            include: { tasks: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMember(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      memberProfile: {
        include: {
          subscriptions: { include: { plan: true, payments: true } },
          attendance: { orderBy: { checkInAt: "desc" }, take: 20 },
          progressEntries: { orderBy: { measuredAt: "desc" }, take: 50 },
          trainerAssignments: { where: { active: true }, include: { trainer: { include: { user: true } } } },
          workoutRoutines: {
            where: { isActive: true },
            include: { tasks: { include: { logs: true } } }
          },
        },
      },
    },
  });
}

export async function suspendMember(id: string) {
  return prisma.user.update({ where: { id }, data: { isActive: false } });
}

export async function reactivateMember(id: string) {
  return prisma.user.update({ where: { id }, data: { isActive: true } });
}
