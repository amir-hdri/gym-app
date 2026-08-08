/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

function createMockPrisma() {
  const memoryStore: Record<string, any[]> = {
    user: [],
    memberProfile: [],
    plan: [],
    subscription: [],
    attendance: [],
    workoutRoutine: [],
    workoutTask: [],
    workoutLog: [],
    workoutSchedule: [],
    notification: [],
    payment: [],
    freezeRequest: [],
    classSession: [],
    classBooking: [],
    auditLog: [],
  };

  const makeModel = (modelName: string) =>
    new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          if (prop === "then") return undefined;
          return async (...args: any[]) => {
            const p = String(prop);
            const store = memoryStore[modelName] || (memoryStore[modelName] = []);

            if (p === "findMany") {
              const query = args?.[0] || {};
              let res = [...store];
              if (query.where) {
                res = res.filter((item) => {
                  for (const [k, v] of Object.entries(query.where)) {
                    if (v === undefined) continue;
                    if (v && typeof v === "object" && !Array.isArray(v)) {
                      if ("gte" in (v as any) && item[k] < (v as any).gte) return false;
                      if ("lte" in (v as any) && item[k] > (v as any).lte) return false;
                      if ("gt" in (v as any) && item[k] <= (v as any).gt) return false;
                      if ("lt" in (v as any) && item[k] >= (v as any).lt) return false;
                      if ("in" in (v as any) && !(v as any).in.includes(item[k])) return false;
                      if ("not" in (v as any) && item[k] === (v as any).not) return false;
                      if ("contains" in (v as any) && !String(item[k] || "").toLowerCase().includes(String((v as any).contains).toLowerCase())) return false;
                      continue;
                    }
                    if (v === null && item[k] !== null) return false;
                    if (v !== null && item[k] !== v) return false;
                  }
                  return true;
                });
              }
              if (query.take && typeof query.take === "number") {
                res = res.slice(0, query.take);
              }
              return res;
            }

            if (p === "count") {
              const query = args?.[0] || {};
              const res = await (makeModel(modelName) as any).findMany(query);
              return res.length;
            }

            if (["findUnique", "findFirst"].includes(p)) {
              const query = args?.[0] || {};
              if (query.where) {
                const found = store.find((item) => {
                  for (const [k, v] of Object.entries(query.where)) {
                    if (v === undefined) continue;
                    if (v === null && item[k] !== null) return false;
                    if (v !== null && typeof v !== "object" && item[k] !== v) return false;
                  }
                  return true;
                });
                if (found) return found;
              }
              return null;
            }

            if (["findUniqueOrThrow", "findFirstOrThrow"].includes(p)) {
              const query = args?.[0] || {};
              const found = await (makeModel(modelName) as any).findFirst(query);
              if (found) return found;
              return {
                id: "mock-id",
                name: "Mock Plan",
                price: 350000,
                durationDays: 30,
                freezeDaysAllowed: 0,
                maxSessions: 12,
                isSessionBased: false,
                amount: 350000,
                plan: { name: "Mock Plan", price: 350000, durationDays: 30, freezeDaysAllowed: 0, maxSessions: 12, isSessionBased: false },
                member: { user: { name: "کاربر آزمایشی", id: "mock-user" }, membershipCode: "MEM-MOCK", userId: "mock-user" },
                subscription: {
                  id: "mock-sub",
                  plan: { name: "Mock Plan", price: 350000, durationDays: 30 },
                  member: { user: { name: "کاربر آزمایشی", id: "mock-user" } },
                },
                user: { name: "کاربر آزمایشی", id: "mock-user", phone: "+100000000", branchId: null },
                memberProfile: null,
              };
            }

            if (["create", "upsert"].includes(p)) {
              const data = args?.[0]?.data || args?.[0]?.create || {};
              const flatData: any = { ...data };
              if (flatData.memberProfile?.create) {
                flatData.memberProfile = { id: "mock-profile", ...flatData.memberProfile.create };
              }
              if (flatData.staffProfile?.create) {
                flatData.staffProfile = { id: "mock-staff", ...flatData.staffProfile.create };
              }
              const created = {
                id: data.id || "mock-" + Math.random().toString(36).substring(2, 9),
                ...flatData,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              store.push(created);
              return created;
            }

            if (p === "update") {
              const where = args?.[0]?.where || {};
              const data = args?.[0]?.data || {};
              const index = store.findIndex((item) => {
                for (const [k, v] of Object.entries(where)) {
                  if (item[k] === v) return true;
                }
                return false;
              });
              const updatedData = { ...data };
              if (data.sessionsUsed?.increment) {
                const current = (index >= 0 ? store[index].sessionsUsed : 0) || 0;
                updatedData.sessionsUsed = current + data.sessionsUsed.increment;
              }
              if (index >= 0) {
                store[index] = { ...store[index], ...updatedData, updatedAt: new Date() };
                return store[index];
              }
              return { id: where.id || "mock-id", ...updatedData, updatedAt: new Date() };
            }

            if (p === "delete") {
              const where = args?.[0]?.where || {};
              const index = store.findIndex((item) => item.id === where.id);
              if (index >= 0) {
                const removed = store.splice(index, 1);
                return removed[0];
              }
              return { id: where.id || "mock-id" };
            }

            if (["createMany", "updateMany", "deleteMany"].includes(p)) {
              if (p === "createMany" && Array.isArray(args?.[0]?.data)) {
                args[0].data.forEach((d: any) => {
                  store.push({ id: "mock-" + Math.random().toString(36).substring(2, 9), ...d, createdAt: new Date() });
                });
                return { count: args[0].data.length };
              }
              return { count: 0 };
            }

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
      const p = String(prop);
      if (p === "$transaction") {
        return async (arg: any) => {
          if (Array.isArray(arg)) return Promise.all(arg);
          if (typeof arg === "function") return arg(new Proxy({}, handler));
          return arg;
        };
      }
      if (p === "$connect" || p === "$disconnect" || p === "$on" || p === "$use") {
        return async () => {};
      }
      if (p === "__isMock") return true;
      return makeModel(p);
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
