"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createTrainerSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر"),
  phone: z.string().min(7, "شماره تلفن نامعتبر"),
  email: z.string().email("ایمیل نامعتبر").optional().or(z.literal("")),
  password: z.string().min(6).default("trainer123"),
  title: z.string().optional(),
  employeeCode: z.string().optional(),
});

export async function createTrainer(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized - فقط مدیران");

  const raw = {
    name: (formData.get("name") as string)?.trim() || "",
    phone: (formData.get("phone") as string)?.trim() || "",
    email: (formData.get("email") as string)?.trim() || "",
    password: (formData.get("password") as string) || "trainer123",
    title: (formData.get("title") as string)?.trim() || "",
    employeeCode: (formData.get("employeeCode") as string)?.trim() || "",
  };

  const data = createTrainerSchema.parse(raw);

  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) throw new Error("شماره تلفن تکراری است");

  if (data.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } }).catch(() => null);
    if (existingEmail) throw new Error("ایمیل تکراری است");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const employeeCode = data.employeeCode || `STAFF-${Date.now().toString(36).toUpperCase()}`;

  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({ data: { name: "شعبه اصلی" } });
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      passwordHash,
      role: "TRAINER",
      branchId: branch.id,
      staffProfile: {
        create: {
          employeeCode,
          title: data.title || "مربی باشگاه",
          status: "ACTIVE",
        },
      },
    },
  });

  revalidatePath("/manager/trainers");
  return user;
}

export async function listTrainers() {
  return prisma.staffProfile.findMany({
    include: {
      user: true,
      _count: {
        select: {
          trainerAssignments: { where: { active: true } },
          classes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deactivateTrainer(staffId: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const staff = await prisma.staffProfile.update({
    where: { id: staffId },
    data: { status: "INACTIVE" },
  });
  revalidatePath("/manager/trainers");
  return staff;
}

export async function activateTrainer(staffId: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const staff = await prisma.staffProfile.update({
    where: { id: staffId },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/manager/trainers");
  return staff;
}

export async function assignTrainerToMember(memberId: string, trainerId: string, note?: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  // Deactivate previous assignments for this member
  await prisma.trainerAssignment.updateMany({
    where: { memberId, active: true },
    data: { active: false, endDate: new Date() },
  });

  const assignment = await prisma.trainerAssignment.create({
    data: {
      memberId,
      trainerId,
      assignedByUserId: session.user.id,
      note: note || null,
      active: true,
    },
  });

  revalidatePath("/manager/members");
  revalidatePath("/manager/trainers");
  return assignment;
}
