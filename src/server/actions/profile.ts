"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

  // Update user name, email, phone
  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      memberProfile: {
        update: {
          emergencyName: data.emergencyName || null,
          emergencyPhone: data.emergencyPhone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          medicalNotes: data.medicalNotes || null,
        },
      },
    },
  });

  revalidatePath("/member/profile");
  return updatedUser;
}
