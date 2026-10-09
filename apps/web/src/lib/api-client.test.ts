import axios, { type AxiosAdapter } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./api-client";

const originalAdapter = axios.defaults.adapter;
beforeEach(() =>
  vi.stubGlobal("localStorage", { getItem: () => null, clear: () => {} }),
);
afterEach(() => {
  axios.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
});

describe("real API pagination", () => {
  it("loads every page and preserves filters for a client-paginated directory", async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      const page = config.params?.page ?? 1;
      return {
        data: {
          success: true,
          data: [{ id: `user-${page}` }],
          meta: { page, pageSize: 1, total: 3, totalPages: 3 },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    });
    axios.defaults.adapter = adapter;
    const result = await new ApiClient().getUsers({ role: "athlete" });
    expect(result.data?.map((u) => u.id)).toEqual([
      "user-1",
      "user-2",
      "user-3",
    ]);
    expect(adapter).toHaveBeenCalledTimes(3);
    expect(
      adapter.mock.calls.every(([config]) => config.params.role === "athlete"),
    ).toBe(true);
    expect(result.meta?.totalPages).toBe(1);
  });

  it("keeps an explicitly requested server page paginated", async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => ({
      data: {
        success: true,
        data: [{ id: "user-2" }],
        meta: { page: 2, pageSize: 1, total: 3, totalPages: 3 },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    axios.defaults.adapter = adapter;
    const result = await new ApiClient().getUsers({ page: 2, page_size: 1 });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(result.meta?.page).toBe(2);
    expect(result.meta?.totalPages).toBe(3);
  });

  it("reports a failed later page instead of presenting an incomplete total as complete", async () => {
    axios.defaults.adapter = async (config) => {
      if (config.params?.page === 2) throw new Error("Network interrupted");
      return {
        data: {
          success: true,
          data: [{ id: "first" }],
          meta: { page: 1, pageSize: 1, total: 2, totalPages: 2 },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
    await expect(new ApiClient().getUsers()).rejects.toThrow(
      "Network interrupted",
    );
  });
});
