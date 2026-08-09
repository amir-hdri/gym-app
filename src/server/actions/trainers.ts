"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createTrainerSchema = z.object({
  name: z.string().min(2, "نام مربی حداقل ۲ کاراکتر است"),
  phone: z.string().min(7, "شماره تلفن نامعتبر است"),
  email: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر باشد").default("trainer123"),
  title: z.string().optional(),
  employeeCode: z.string().optional(),
});

const updateTrainerSchema = z.object({
  staffId: z.string().min(1, "شناسه پرسنل الزامی است"),
  name: z.string().min(2, "نام مربی حداقل ۲ کاراکتر است"),
  phone: z.string().min(7, "شماره تلفن نامعتبر است"),
  email: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  title: z.string().optional(),
  employeeCode: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  newPassword: z.string().min(6).optional().or(z.literal("")),
});

const scheduleSchema = z.object({
  trainerId: z.string().min(1, "انتخاب مربی الزامی است"),
  title: z.string().min(2, "عنوان سانس یا کلاس الزامی است"),
  category: z.string().optional(),
  location: z.string().optional(),
  capacity: z.coerce.number().min(1).default(15),
  startAt: z.string().min(1, "زمان شروع الزامی است"),
  endAt: z.string().min(1, "زمان پایان الزامی است"),
  description: z.string().optional(),
});

export async function createTrainer(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) {
    throw new Error("Unauthorized - فقط مدیران مجاز به ثبت مربی هستند");
  }

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
  if (existing) throw new Error("شماره تلفن وارد شده تکراری است");

  if (data.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } }).catch(() => null);
    if (existingEmail) throw new Error("ایمیل وارد شده تکراری است");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const employeeCode = data.employeeCode || `TRN-${Date.now().toString(36).toUpperCase()}`;

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
    include: { staffProfile: true },
  });

  revalidatePath("/manager/trainers");
  revalidatePath("/trainer/dashboard");
  return user;
}

export async function updateTrainer(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) {
    throw new Error("Unauthorized - فقط مدیران مجاز به ویرایش مربی هستند");
  }

  const raw = {
    staffId: (formData.get("staffId") as string)?.trim() || "",
    name: (formData.get("name") as string)?.trim() || "",
    phone: (formData.get("phone") as string)?.trim() || "",
    email: (formData.get("email") as string)?.trim() || "",
    title: (formData.get("title") as string)?.trim() || "",
    employeeCode: (formData.get("employeeCode") as string)?.trim() || "",
    status: (formData.get("status") as any) || "ACTIVE",
    newPassword: (formData.get("newPassword") as string)?.trim() || "",
  };

  const data = updateTrainerSchema.parse(raw);

  const staff = await prisma.staffProfile.findUnique({
    where: { id: data.staffId },
    include: { user: true },
  });
  if (!staff) throw new Error("پروفایل مربی یافت نشد");

  // Check phone uniqueness if changed
  if (data.phone !== staff.user?.phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone && existingPhone.id !== staff.userId) {
      throw new Error("این شماره تلفن متعلق به کاربر دیگری است");
    }
  }

  // Update staff profile
  await prisma.staffProfile.update({
    where: { id: data.staffId },
    data: {
      title: data.title || staff.title,
      employeeCode: data.employeeCode || staff.employeeCode,
      status: data.status,
    },
  });

  // Update user info
  const userUpdateData: any = {
    name: data.name,
    phone: data.phone,
    email: data.email || null,
  };

  if (data.newPassword && data.newPassword.length >= 6) {
    userUpdateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  await prisma.user.update({
    where: { id: staff.userId },
    data: userUpdateData,
  });

  revalidatePath("/manager/trainers");
  revalidatePath("/trainer/dashboard");
  revalidatePath("/trainer/profile");
  return { success: true };
}

export async function deleteTrainer(staffId: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) {
    throw new Error("Unauthorized - فقط مدیران مجاز به حذف مربی هستند");
  }

  const staff = await prisma.staffProfile.findUnique({
    where: { id: staffId },
    include: { user: true },
  });
  if (!staff) throw new Error("مربی یافت نشد");

  // Remove assignments
  await prisma.trainerAssignment.deleteMany({
    where: { trainerId: staffId },
  }).catch(() => {});

  // Remove staff profile
  await prisma.staffProfile.delete({
    where: { id: staffId },
  });

  // Remove user if exists
  if (staff.userId) {
    await prisma.user.delete({
      where: { id: staff.userId },
    }).catch(() => {});
  }

  revalidatePath("/manager/trainers");
  revalidatePath("/trainer/dashboard");
  return { success: true };
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

  // Deactivate previous active assignments for this member
  await prisma.trainerAssignment.updateMany({
    where: { memberId, active: true },
    data: { active: false, endDate: new Date() },
  });

  const assignment = await prisma.trainerAssignment.create({
    data: {
      memberId,
      trainerId,
      assignedByUserId: session.user.id,
      note: note || "تخصیص یافته توسط مدیریت باشگاه",
      active: true,
    },
  });

  // Notify member and trainer
  const member = await prisma.memberProfile.findUnique({ where: { id: memberId }, select: { userId: true } });
  const trainer = await prisma.staffProfile.findUnique({ where: { id: trainerId }, select: { userId: true, title: true } });

  if (member?.userId) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        channel: "IN_APP",
        type: "TRAINER",
        title: "مربی اختصاصی شما تعیین شد 🏋️‍♂️",
        body: "مدیریت باشگاه مربی اختصاصی جدیدی برای شما تعیین نمود.",
      },
    }).catch(() => {});
  }

  if (trainer?.userId) {
    await prisma.notification.create({
      data: {
        userId: trainer.userId,
        channel: "IN_APP",
        type: "ATHLETE",
        title: "شاگرد جدید به شما اختصاص یافت 👥",
        body: "یک ورزشکار جدید از سوی مدیریت به شما اختصاص داده شد.",
      },
    }).catch(() => {});
  }

  revalidatePath("/manager/members");
  revalidatePath("/manager/trainers");
  revalidatePath("/trainer/members");
  revalidatePath("/trainer/dashboard");
  return assignment;
}

export async function unassignTrainerFromMember(assignmentId: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  await prisma.trainerAssignment.update({
    where: { id: assignmentId },
    data: { active: false, endDate: new Date() },
  });

  revalidatePath("/manager/members");
  revalidatePath("/manager/trainers");
  revalidatePath("/trainer/members");
  revalidatePath("/trainer/dashboard");
  return { success: true };
}

export async function addTrainerSchedule(rawInput: z.infer<typeof scheduleSchema>) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const data = scheduleSchema.parse(rawInput);
  const trainer = await prisma.staffProfile.findUnique({
    where: { id: data.trainerId },
    include: { user: true },
  });

  let branch = await prisma.branch.findFirst();

  const start = new Date(data.startAt);
  const end = new Date(data.endAt);

  const sessionRecord = await prisma.classSession.create({
    data: {
      trainerId: data.trainerId,
      branchId: branch?.id || null,
      title: data.title.trim(),
      trainerName: trainer?.user?.name || "مربی باشگاه",
      category: data.category || "فیتنس و بدنسازی",
      location: data.location || "سالن اصلی باشگاه",
      capacity: Number(data.capacity) || 15,
      description: data.description || null,
      startAt: start,
      endAt: end,
      status: "scheduled",
    },
  });

  revalidatePath("/manager/trainers");
  revalidatePath("/manager/classes");
  revalidatePath("/trainer/classes");
  revalidatePath("/trainer/dashboard");
  return sessionRecord;
}

export async function deleteTrainerSchedule(sessionId: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  await prisma.classSession.delete({
    where: { id: sessionId },
  });

  revalidatePath("/manager/trainers");
  revalidatePath("/manager/classes");
  revalidatePath("/trainer/classes");
  revalidatePath("/trainer/dashboard");
  return { success: true };
}

export async function listTrainers() {
  return prisma.staffProfile.findMany({
    include: {
      user: true,
      trainerAssignments: {
        where: { active: true },
        include: {
          member: {
            include: { user: true },
          },
        },
      },
      classes: {
        orderBy: { startAt: "asc" },
      },
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

export async function getAllMembersForAssignment() {
  return prisma.memberProfile.findMany({
    include: {
      user: true,
      trainerAssignments: {
        where: { active: true },
        include: {
          trainer: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
