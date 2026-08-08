"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isManager } from "@/lib/permissions";

const planSchema = z.object({
  name: z.string().min(2, "نام طرح حداقل ۲ کاراکتر"),
  price: z.coerce.number().positive("قیمت باید مثبت باشد"),
  durationDays: z.coerce.number().int().positive("مدت زمان باید مثبت باشد"),
  freezeDaysAllowed: z.coerce.number().int().min(0, "روزهای تعلیق نمی‌تواند منفی باشد").default(0),
  maxSessions: z.coerce.number().int().min(0).optional().nullable(),
  isSessionBased: z.coerce.boolean().default(false),
  maxVisitsPerWeek: z.coerce.number().int().min(1).optional().nullable(),
  highlights: z.string().optional(),
});

export async function createPlan(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) {
    throw new Error("عدم دسترسی");
  }

  const isSessionBased =
    formData.get("isSessionBased") === "true" ||
    formData.get("isSessionBased") === "on" ||
    formData.get("isSessionBased") === "1";

  const maxSessionsRaw = formData.get("maxSessions");
  const maxSessions = maxSessionsRaw ? parseInt(String(maxSessionsRaw), 10) : null;

  const data = planSchema.parse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
    freezeDaysAllowed: formData.get("freezeDaysAllowed") || 0,
    maxSessions: isSessionBased ? maxSessions || 12 : maxSessions,
    isSessionBased,
    maxVisitsPerWeek: formData.get("maxVisitsPerWeek")
      ? parseInt(String(formData.get("maxVisitsPerWeek")), 10)
      : null,
    highlights: formData.get("highlights"),
  });

  const branch = await prisma.branch.findFirst();

  const plan = await prisma.plan.create({
    data: {
      name: data.name.trim(),
      price: data.price,
      durationDays: data.durationDays,
      freezeDaysAllowed: data.freezeDaysAllowed,
      maxSessions: data.maxSessions ?? null,
      isSessionBased: data.isSessionBased,
      maxVisitsPerWeek: data.maxVisitsPerWeek ?? null,
      highlights: data.highlights?.trim() || "",
      branchId: branch?.id || null,
    },
  });

  revalidatePath("/manager/plans");
  revalidatePath("/member/membership");

  return plan;
}

export async function updatePlan(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const isSessionBased =
    formData.get("isSessionBased") === "true" ||
    formData.get("isSessionBased") === "on" ||
    formData.get("isSessionBased") === "1";

  const maxSessionsRaw = formData.get("maxSessions");
  const maxSessions = maxSessionsRaw ? parseInt(String(maxSessionsRaw), 10) : null;

  const data = planSchema.partial().parse({
    name: formData.get("name") ? String(formData.get("name")) : undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    durationDays: formData.get("durationDays") ? Number(formData.get("durationDays")) : undefined,
    freezeDaysAllowed: formData.get("freezeDaysAllowed") ? Number(formData.get("freezeDaysAllowed")) : undefined,
    maxSessions: isSessionBased ? maxSessions || 12 : maxSessions,
    isSessionBased,
    highlights: formData.get("highlights") ? String(formData.get("highlights")) : undefined,
  });

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.durationDays !== undefined ? { durationDays: data.durationDays } : {}),
      ...(data.freezeDaysAllowed !== undefined ? { freezeDaysAllowed: data.freezeDaysAllowed } : {}),
      ...(data.maxSessions !== undefined ? { maxSessions: data.maxSessions } : {}),
      ...(data.isSessionBased !== undefined ? { isSessionBased: data.isSessionBased } : {}),
      ...(data.highlights !== undefined ? { highlights: data.highlights?.trim() } : {}),
    },
  });

  revalidatePath("/manager/plans");
  revalidatePath("/member/membership");
  return plan;
}

export async function listPlans(includeInactive = false) {
  if (includeInactive) {
    return prisma.plan.findMany({ orderBy: { price: "asc" } });
  }
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
}

export async function listAllPlans() {
  return prisma.plan.findMany({ orderBy: [{ isActive: "desc" }, { price: "asc" }] });
}

export async function deactivatePlan(id: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const plan = await prisma.plan.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/manager/plans");
  return plan;
}

export async function activatePlan(id: string) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) throw new Error("Unauthorized");

  const plan = await prisma.plan.update({ where: { id }, data: { isActive: true } });
  revalidatePath("/manager/plans");
  return plan;
}
