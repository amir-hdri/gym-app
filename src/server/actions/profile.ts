"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر"),
  email: z.string().email("ایمیل نامعتبر").optional().or(z.literal("")),
  phone: z.string().min(7, "شماره تلفن نامعتبر"),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  medicalNotes: z.string().optional(),
});

export async function updateProfile(data: {
  name: string;
  email?: string;
  phone: string;
  emergencyName?: string;
  emergencyPhone?: string;
  dateOfBirth?: string;
  medicalNotes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const parsed = profileSchema.parse({
    name: data.name,
    email: data.email || "",
    phone: data.phone,
    emergencyName: data.emergencyName || "",
    emergencyPhone: data.emergencyPhone || "",
    dateOfBirth: data.dateOfBirth || "",
    medicalNotes: data.medicalNotes || "",
  });

  // Check phone duplicate (if changed)
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser) throw new Error("کاربر یافت نشد");
  
  if (parsed.phone !== currentUser.phone) {
    const dup = await prisma.user.findUnique({ where: { phone: parsed.phone } });
    if (dup) throw new Error("این شماره تلفن قبلاً ثبت شده است");
  }

  if (parsed.email && parsed.email !== currentUser.email) {
    const dupEmail = await prisma.user.findUnique({ where: { email: parsed.email } }).catch(() => null);
    if (dupEmail) throw new Error("این ایمیل قبلاً استفاده شده است");
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.name.trim(),
      email: parsed.email?.trim() || null,
      phone: parsed.phone.trim(),
      memberProfile: {
        update: {
          emergencyName: parsed.emergencyName?.trim() || null,
          emergencyPhone: parsed.emergencyPhone?.trim() || null,
          dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
          medicalNotes: parsed.medicalNotes?.trim() || null,
        },
      },
    },
  });

  revalidatePath("/member/profile");
  revalidatePath("/member/dashboard");
  return updatedUser;
}

export async function updateMemberProfileAsManager(
  userId: string,
  data: {
    name?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    medicalNotes?: string;
    notes?: string;
  }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { isManager } = await import("@/lib/permissions");
  if (!isManager(role)) throw new Error("Unauthorized");

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name?.trim(),
      memberProfile: {
        update: {
          emergencyName: data.emergencyName?.trim() || null,
          emergencyPhone: data.emergencyPhone?.trim() || null,
          medicalNotes: data.medicalNotes?.trim() || null,
          notes: data.notes?.trim() || null,
        }
      }
    }
  });

  revalidatePath("/manager/members");
  return user;
}
