import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  TRAINER: "TRAINER",
  MEMBER: "MEMBER",
};

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123", 12);
  const managerHash = await bcrypt.hash("manager123", 12);
  const memberHash = await bcrypt.hash("member123", 12);

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { id: "branch-main" },
    update: {},
    create: {
      id: "branch-main",
      name: "Main Branch",
      phone: "+1-555-0000",
      address: "123 Fitness Street",
      city: "Your City",
    },
  });

  // Create owner/admin
  const owner = await prisma.user.upsert({
    where: { phone: "+1-555-0001" },
    update: {
      passwordHash: adminHash,
      role: UserRole.OWNER,
    },
    create: {
      name: "مدیر ارشد باشگاه",
      phone: "+1-555-0001",
      email: "admin@gym.com",
      passwordHash: adminHash,
      role: UserRole.OWNER,
      branchId: branch.id,
      staffProfile: {
        create: {
          employeeCode: "STAFF-001",
          title: "Owner",
        },
      },
    },
  });

  // Create manager
  const manager = await prisma.user.upsert({
    where: { phone: "+1-555-0002" },
    update: {
      passwordHash: managerHash,
      role: UserRole.MANAGER,
    },
    create: {
      name: "مدیر داخلی باشگاه",
      phone: "+1-555-0002",
      email: "manager@gym.com",
      passwordHash: managerHash,
      role: UserRole.MANAGER,
      branchId: branch.id,
      staffProfile: {
        create: {
          employeeCode: "STAFF-002",
          title: "Manager",
        },
      },
    },
  });

  // Create sample plans
  await prisma.plan.deleteMany({ where: { branchId: branch.id } }).catch(() => {});
  await prisma.plan.createMany({
    data: [
      {
        name: "ماهانه پایه",
        price: 350000,
        durationDays: 30,
        freezeDaysAllowed: 0,
        highlights: "دسترسی به باشگاه, ورود با کد QR موبایل, یادآوری‌های ایمیلی",
        branchId: branch.id,
      },
      {
        name: "ماهانه پرمیوم",
        price: 650000,
        durationDays: 30,
        freezeDaysAllowed: 7,
        highlights: "تمامی امکانات پایه, رزرو آنلاین کلاس‌ها, سیستم تعیین مربی اختصاصی, اعلانات پاپ‌آپ موبایل",
        branchId: branch.id,
      },
      {
        name: "سالانه الیت",
        price: 5900000,
        durationDays: 365,
        freezeDaysAllowed: 30,
        highlights: "تمامی امکانات پرمیوم, پشتیبانی اولویت‌دار ۲۴ ساعته, گزارشات دقیق درآمد, سیستم معرفی دوستان",
        branchId: branch.id,
      },
    ],
  });

  const plans = await prisma.plan.findMany({ where: { branchId: branch.id } });
  const basicPlan = plans.find(p => p.name === "ماهانه پایه")!;
  const premiumPlan = plans.find(p => p.name === "ماهانه پرمیوم")!;
  const annualPlan = plans.find(p => p.name === "سالانه الیت")!;


  // Create members
  const membersData = [
    {
      name: "سارا محمدی",
      phone: "+1-555-1001",
      email: "sara@example.com",
      code: "MEM-001",
      plan: premiumPlan,
    },
    {
      name: "رضا احمدی",
      phone: "+1-555-1002",
      email: "reza@example.com",
      code: "MEM-002",
      plan: basicPlan,
    },
    {
      name: "علی علوی",
      phone: "+1-555-1003",
      email: "ali@example.com",
      code: "MEM-003",
      plan: annualPlan,
    },
  ];

  for (const m of membersData) {
    const user = await prisma.user.upsert({
      where: { phone: m.phone },
      update: {
        passwordHash: memberHash,
        role: UserRole.MEMBER,
      },
      create: {
        name: m.name,
        phone: m.phone,
        email: m.email,
        passwordHash: memberHash,
        role: UserRole.MEMBER,
        branchId: branch.id,
        memberProfile: {
          create: {
            membershipCode: m.code,
          },
        },
      },
      include: {
        memberProfile: true,
      },
    });

    const profileId = user.memberProfile!.id;

    // Seed relationship data if none exists
    const subCount = await prisma.subscription.count({ where: { memberId: profileId } });
    if (subCount === 0 && m.plan) {
      const now = new Date();
      const startedAt = new Date();
      startedAt.setDate(now.getDate() - 10);
      const endsAt = new Date();
      endsAt.setDate(startedAt.getDate() + m.plan.durationDays);

      const sub = await prisma.subscription.create({
        data: {
          memberId: profileId,
          planId: m.plan.id,
          status: "ACTIVE",
          startedAt,
          endsAt,
          branchId: branch.id,
        },
      });

      await prisma.payment.create({
        data: {
          subscriptionId: sub.id,
          amount: m.plan.price,
          currency: "USD",
          method: "CASH",
          status: "PAID",
        },
      });

      // Attendance check-ins
      for (let i = 1; i <= 5; i++) {
        const checkInAt = new Date();
        checkInAt.setDate(now.getDate() - i);
        checkInAt.setHours(9, 30, 0, 0);
        await prisma.attendance.create({
          data: {
            memberId: profileId,
            branchId: branch.id,
            checkInAt,
            method: "QR",
          },
        });
      }

      // Progress entries
      const progressList = [
        { type: "WEIGHT", val: 68.5, daysAgo: 14 },
        { type: "WEIGHT", val: 67.8, daysAgo: 7 },
        { type: "WEIGHT", val: 67.2, daysAgo: 0 },
        { type: "BODY_FAT", val: 24.5, daysAgo: 14 },
        { type: "BODY_FAT", val: 23.8, daysAgo: 7 },
        { type: "BODY_FAT", val: 23.2, daysAgo: 0 },
      ];
      for (const p of progressList) {
        const measuredAt = new Date();
        measuredAt.setDate(now.getDate() - p.daysAgo);
        await prisma.progressEntry.create({
          data: {
            memberId: profileId,
            metricType: p.type,
            value: p.val,
            unit: p.type === "WEIGHT" ? "kg" : "%",
            measuredAt,
          },
        });
      }
    }
  }

  console.log("-----------------------------------------");
  console.log("✅ Seed complete!");
  console.log("🔑 OWNER: admin@gym.com / admin123");
  console.log("🔑 MANAGER: manager@gym.com / manager123");
  console.log("🔑 MEMBERS: [sara@example.com, reza@example.com, ali@example.com] / member123");
  console.log("-----------------------------------------");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
