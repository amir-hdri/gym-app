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
  highlights: z.string().optional(),
});

export async function createPlan(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isManager((session.user as any).role)) {
    throw new Error("عدم دسترسی");
  }

  const data = planSchema.parse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
    freezeDaysAllowed: formData.get("freezeDaysAllowed") || 0,
    highlights: formData.get("highlights"),
  });

  const branch = await prisma.branch.findFirst();
  
  const plan = await prisma.plan.create({
    data: {
      name: data.name.trim(),
      price: data.price,
      durationDays: data.durationDays,
      freezeDaysAllowed: data.freezeDaysAllowed,
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

  const data = planSchema.partial().parse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
    freezeDaysAllowed: formData.get("freezeDaysAllowed"),
    highlights: formData.get("highlights"),
  });

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      price: data.price,
      durationDays: data.durationDays,
      freezeDaysAllowed: data.freezeDaysAllowed,
      highlights: data.highlights?.trim(),
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
