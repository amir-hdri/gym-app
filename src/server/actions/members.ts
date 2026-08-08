"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const createMemberSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر باید باشد"),
  phone: z.string().min(7, "شماره تلفن نامعتبر است"),
  email: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر").default("changeme"),
});

export async function createMember(formData: FormData) {
  const raw = {
    name: (formData.get("name") as string)?.trim() || "",
    phone: (formData.get("phone") as string)?.trim() || "",
    email: (formData.get("email") as string)?.trim() || undefined,
    password: (formData.get("password") as string) || "changeme",
  };

  const data = createMemberSchema.parse(raw);

  // Check duplicates
  const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existingPhone) {
    throw new Error("شماره تلفن تکراری است - کاربر با این شماره وجود دارد");
  }
  if (data.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } }).catch(() => null);
    if (existingEmail) {
      throw new Error("ایمیل تکراری است");
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const membershipCode = "MEM-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,5).toUpperCase();

  // Find default branch
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: { name: "شعبه اصلی", city: "تهران" }
    });
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      passwordHash,
      role: "MEMBER",
      branchId: branch.id,
      memberProfile: {
        create: { membershipCode },
      },
    },
  });

  revalidatePath("/manager/members");
  revalidatePath("/manager/dashboard");

  return user;
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
  // id is userId (from session)
  // Try find by user id first, then try memberProfile id fallback
  let user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberProfile: {
        include: {
          subscriptions: { 
            include: { plan: true, payments: true },
            orderBy: { createdAt: "desc" }
          },
          attendance: { orderBy: { checkInAt: "desc" }, take: 20 },
          progressEntries: { orderBy: { measuredAt: "desc" }, take: 50 },
          trainerAssignments: { where: { active: true }, include: { trainer: { include: { user: true } } } },
          workoutRoutines: {
            where: { isActive: true },
            include: { tasks: { include: { logs: true } } }
          },
          freezeRequests: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
    },
  });

  if (!user) {
    // Try to find by memberProfile id
    const profile = await prisma.memberProfile.findUnique({
      where: { id },
      include: {
        user: true,
        subscriptions: { include: { plan: true, payments: true }, orderBy: { createdAt: "desc" } },
        attendance: { orderBy: { checkInAt: "desc" }, take: 20 },
        progressEntries: { orderBy: { measuredAt: "desc" }, take: 50 },
        workoutRoutines: { where: { isActive: true }, include: { tasks: { include: { logs: true } } } },
        freezeRequests: { orderBy: { createdAt: "desc" } },
      }
    });
    if (profile?.user) {
      // reshape to match expected structure
      return {
        ...profile.user,
        memberProfile: profile,
      } as any;
    }
  }

  return user;
}

export async function suspendMember(id: string) {
  const res = await prisma.user.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/manager/members");
  return res;
}

export async function reactivateMember(id: string) {
  const res = await prisma.user.update({ where: { id }, data: { isActive: true } });
  revalidatePath("/manager/members");
  return res;
}

export async function deleteMember(id: string) {
  // Soft delete: deactivate
  return suspendMember(id);
}

export async function searchMembers(query: string) {
  if (!query.trim()) return listMembers();
  return prisma.user.findMany({
    where: {
      role: "MEMBER",
      OR: [
        { name: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
      ],
    },
    include: {
      memberProfile: {
        include: {
          subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    take: 20,
  });
}
