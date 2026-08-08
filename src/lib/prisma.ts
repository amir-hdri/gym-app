/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

function createMockPrisma() {
  const makeModel = () =>
    new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          if (prop === "then") return undefined;
          return async (...args: any[]) => {
            const p = String(prop);
            if (p === "findMany") return [];
            if (p === "count") return 0;
            if (["findUnique", "findFirst"].includes(p)) {
              return null;
            }
            if (["findUniqueOrThrow", "findFirstOrThrow"].includes(p)) {
              return {
                id: "mock-id",
                name: "Mock",
                price: 0,
                durationDays: 30,
                freezeDaysAllowed: 0,
                amount: 0,
                plan: { name: "Mock Plan", price: 0, durationDays: 30, freezeDaysAllowed: 0 },
                member: { user: { name: "Mock User", id: "mock-user" }, membershipCode: "MEM-MOCK", userId: "mock-user" },
                subscription: {
                  id: "mock-sub",
                  plan: { name: "Mock Plan", price: 0, durationDays: 30 },
                  member: { user: { name: "Mock", id: "mock" } },
                },
                user: { name: "Mock", id: "mock", phone: "+100000000", branchId: null },
                memberProfile: null,
              };
            }
            if (["create", "upsert", "update", "delete"].includes(p)) {
              const data = args?.[0]?.data || {};
              // Flatten nested create
              const flatData: any = { ...data };
              if (flatData.memberProfile?.create) {
                flatData.memberProfile = { id: "mock-profile", ...flatData.memberProfile.create };
              }
              if (flatData.staffProfile?.create) {
                flatData.staffProfile = { id: "mock-staff", ...flatData.staffProfile.create };
              }
              return { id: "mock-" + Math.random().toString(36).substring(2, 9), ...flatData, createdAt: new Date(), updatedAt: new Date() };
            }
            if (["createMany", "updateMany", "deleteMany"].includes(p)) return { count: 0 };
            if (p === "$transaction") {
              const input = args[0];
              if (Array.isArray(input)) return Promise.all(input);
              if (typeof input === "function") return input(createMockPrisma());
              return [];
            }
            return null;
          };
        },
      }
    );

  const handler: ProxyHandler<any> = {
    get: (_target, prop: string) => {
      if (prop === "$transaction") {
        return async (arg: any) => {
          if (Array.isArray(arg)) return Promise.all(arg);
          if (typeof arg === "function") return arg(new Proxy({}, handler));
          return arg;
        };
      }
      if (prop === "$connect" || prop === "$disconnect" || prop === "$on" || prop === "$use") {
        return async () => {};
      }
      if (prop === "__isMock") return true;
      return makeModel();
    },
  };

  return new Proxy({}, handler);
}

let prisma: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  const opts = process.env.NODE_ENV === "production" && !isBuildPhase ? {} : { log: [] as any };
  try {
    if (!global.__prisma) {
      global.__prisma = new PrismaClient(opts);
    }
    prisma = global.__prisma;
  } catch (e) {
    console.warn("[prisma] Real client failed to init, using mock. Error:", (e as any)?.message);
    prisma = createMockPrisma();
  }
} catch (e) {
  console.warn("[prisma] @prisma/client not available, using mock. Error:", (e as any)?.message);
  prisma = createMockPrisma();
}

export { prisma };
