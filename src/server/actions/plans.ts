"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const planSchema = z.object({
  name: z.string().min(2),
  price: z.coerce.number().positive(),
  durationDays: z.coerce.number().int().positive(),
  freezeDaysAllowed: z.coerce.number().int().min(0).default(0),
  highlights: z.string().optional(),
});

export async function createPlan(formData: FormData) {
  const data = planSchema.parse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
    freezeDaysAllowed: formData.get("freezeDaysAllowed"),
    highlights: formData.get("highlights"),
  });

  return prisma.plan.create({
    data: {
      name: data.name,
      price: data.price,
      durationDays: data.durationDays,
      freezeDaysAllowed: data.freezeDaysAllowed,
      highlights: data.highlights || "",
    },
  });
}

export async function listPlans() {
  return prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
}

export async function deactivatePlan(id: string) {
  return prisma.plan.update({ where: { id }, data: { isActive: false } });
}
