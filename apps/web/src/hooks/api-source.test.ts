/**
 * Guards the two things in the data layer that fail silently:
 *
 *  - the lazy `api` proxy, which forwards *any* property name and so cannot
 *    report a typo or a name clash until the call is made in the browser;
 *  - the optimistic-update helpers, where a wrong rollback leaves the user
 *    looking at state that never existed.
 */
import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/lib/types";
import {
  patchItemQueries, patchListQueries, restoreQueries, snapshotQueries,
} from "./api-source";

/** Every method added for API contract v2 §6. */
const CONTRACT_V2_METHODS = [
  "updateProfile", "forgotPassword", "resetPassword", "changePassword",
  "createBranch", "updateBranch", "deleteBranch",
  "deleteMembershipPlan", "deductSession",
  "updateExercise", "deleteExercise",
  "updateGoal", "deleteGoal",
  "updatePayment",
  "getAttendanceTrend", "getRevenueTrend", "getMembershipDistribution",
  "getPeakHours", "getAthleteActivity",
  "createNotification", "broadcastNotification",
  "getConversations", "createConversation", "getConversation",
  "getMessages", "sendMessage", "markConversationRead", "getUnreadMessageCount",
] as const;

describe("api contract v2 §6 surface", () => {
  it("implements every method on the real client", async () => {
    const { api: client } = await import("@/lib/api-client");
    const missing = CONTRACT_V2_METHODS.filter(
      (name) => typeof (client as unknown as Record<string, unknown>)[name] !== "function",
    );
    expect(missing).toEqual([]);
  });

  it("implements every method on the mock service", async () => {
    const { mockService } = await import("@/lib/mock-service");
    const missing = CONTRACT_V2_METHODS.filter(
      (name) => typeof (mockService as unknown as Record<string, unknown>)[name] !== "function",
    );
    expect(missing).toEqual([]);
  });

  it("resolves every method through the lazy proxy", () => {
    // The proxy returns `undefined` for its reserved names (`then`, `catch`,
    // …); anything else must come back callable.
    const unresolved = CONTRACT_V2_METHODS.filter(
      (name) => typeof (api as unknown as Record<string, unknown>)[name] !== "function",
    );
    expect(unresolved).toEqual([]);
  });
});

type Row = { id: string; n: number };
const page = (rows: Row[]): PaginatedResponse<Row> => ({ success: true, data: rows });
const item = (row: Row): ApiResponse<Row> => ({ success: true, data: row });

describe("optimistic cache helpers", () => {
  it("patches every cached page under a key prefix and rolls back exactly", () => {
    const qc = new QueryClient();
    qc.setQueryData(["rows", "a"], page([{ id: "1", n: 1 }]));
    qc.setQueryData(["rows", "b"], page([{ id: "1", n: 1 }, { id: "2", n: 2 }]));

    const snapshot = snapshotQueries(qc, ["rows"]);
    patchListQueries<Row>(qc, ["rows"], (rows) => rows.map((r) => ({ ...r, n: 99 })));

    expect(qc.getQueryData<PaginatedResponse<Row>>(["rows", "a"])?.data).toEqual([{ id: "1", n: 99 }]);
    expect(qc.getQueryData<PaginatedResponse<Row>>(["rows", "b"])?.data?.map((r) => r.n)).toEqual([99, 99]);

    restoreQueries(qc, snapshot);
    expect(qc.getQueryData<PaginatedResponse<Row>>(["rows", "a"])?.data).toEqual([{ id: "1", n: 1 }]);
    expect(qc.getQueryData<PaginatedResponse<Row>>(["rows", "b"])?.data?.map((r) => r.n)).toEqual([1, 2]);
  });

  it("leaves the cache alone when the entry holds no data", () => {
    const qc = new QueryClient();
    // An entry that exists but failed to load, and a key never fetched at all.
    qc.setQueryData(["rows", "empty"], undefined);

    const snapshot = snapshotQueries(qc, ["rows"]);
    patchListQueries<Row>(qc, ["rows"], () => [{ id: "x", n: 1 }]);
    patchItemQueries<Row>(qc, ["single"], () => ({ id: "x", n: 1 }));

    // A patch must never *create* data: that is what makes rollback sound,
    // since restoring an absent snapshot cannot delete an entry.
    expect(qc.getQueryData(["rows", "empty"])).toBeUndefined();
    expect(qc.getQueryData(["single"])).toBeUndefined();

    restoreQueries(qc, snapshot);
    expect(qc.getQueryData(["rows", "empty"])).toBeUndefined();
  });

  it("patches and rolls back a single-object entry", () => {
    const qc = new QueryClient();
    qc.setQueryData(["single", "1"], item({ id: "1", n: 1 }));

    const snapshot = snapshotQueries(qc, ["single", "1"]);
    patchItemQueries<Row>(qc, ["single", "1"], (r) => ({ ...r, n: 42 }));
    expect(qc.getQueryData<ApiResponse<Row>>(["single", "1"])?.data?.n).toBe(42);

    restoreQueries(qc, snapshot);
    expect(qc.getQueryData<ApiResponse<Row>>(["single", "1"])?.data?.n).toBe(1);
  });
});

describe("mock offline demo", () => {
  it("accepts a send, persists it in the thread and clears the unread badge", async () => {
    const { mockService } = await import("@/lib/mock-service");

    const conversations = await mockService.getConversations("u5");
    const thread = conversations.data?.[0];
    expect(thread).toBeDefined();
    const conversationId = thread!.id;

    const before = await mockService.getMessages(conversationId);
    const sent = await mockService.sendMessage(conversationId, "سلام مربی", "u5");
    expect(sent.data?.body).toBe("سلام مربی");

    const after = await mockService.getMessages(conversationId);
    expect(after.data).toHaveLength((before.data?.length ?? 0) + 1);
    expect(after.data?.at(-1)?.id).toBe(sent.data?.id);
    // Ascending by createdAt, so a send lands at the end.
    const times = (after.data ?? []).map((m) => Date.parse(m.createdAt));
    expect([...times].sort((a, b) => a - b)).toEqual(times);

    const unreadBefore = await mockService.getUnreadMessageCount("u5");
    const { data: read } = await mockService.markConversationRead(conversationId, "u5");
    expect(read?.updated).toBeGreaterThan(0);
    const unreadAfter = await mockService.getUnreadMessageCount("u5");
    expect(unreadAfter.data?.count).toBe((unreadBefore.data?.count ?? 0) - (read?.updated ?? 0));
  });

  it("rejects an empty message body", async () => {
    const { mockService } = await import("@/lib/mock-service");
    await expect(mockService.sendMessage("cv1", "   ", "u5")).rejects.toThrow();
  });

  it("returns dense, ascending analytics series", async () => {
    const { mockService } = await import("@/lib/mock-service");

    const attendance = await mockService.getAttendanceTrend(30);
    expect(attendance.data).toHaveLength(30);
    const dates = (attendance.data ?? []).map((p) => p.date);
    expect([...dates].sort()).toEqual(dates);
    // Dense: one point per day, no gaps.
    expect(new Set(dates).size).toBe(30);

    const hours = await mockService.getPeakHours(30);
    expect((hours.data ?? []).map((p) => p.hour)).toEqual([...Array(24).keys()]);

    const revenue = await mockService.getRevenueTrend(6);
    expect(revenue.data).toHaveLength(6);
  });

  it("issues a single-use password-reset token", async () => {
    const { mockService } = await import("@/lib/mock-service");
    const { mockUsers } = await import("@/lib/mock-data");
    const email = mockUsers[0].email;

    const requested = await mockService.forgotPassword(email);
    expect(requested.data?.sent).toBe(true);
    const token = requested.data?.devToken;
    expect(token).toBeTruthy();

    const reset = await mockService.resetPassword(token!, "Newpass1");
    expect(reset.data?.reset).toBe(true);
    // Replaying the same token must fail.
    await expect(mockService.resetPassword(token!, "Newpass2")).rejects.toThrow();
  });

  it("rejects an unknown address without revealing it", async () => {
    const { mockService } = await import("@/lib/mock-service");
    const res = await mockService.forgotPassword("nobody@example.com");
    expect(res.data?.sent).toBe(true);
    expect(res.data?.devToken).toBeUndefined();
  });
});
