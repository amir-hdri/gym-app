import { describe, expect, it } from "vitest";
import type { AxiosError } from "axios";
import { normalizeFastApiError } from "./api-client";

function createMockAxiosError(body: unknown, status = 422): AxiosError {
  return {
    name: "AxiosError",
    message: `Request failed with status code ${status}`,
    isAxiosError: true,
    toJSON: () => ({}),
    response: {
      status,
      statusText: "Unprocessable Entity",
      data: body,
      headers: {},
      config: {} as AxiosError["config"],
    },
  } as unknown as AxiosError;
}

describe("FastAPI error-shape normalization", () => {
  it("derives error/message from a string detail", () => {
    const error = createMockAxiosError({ detail: "اعتبارسنجی ناموفق بود" });
    normalizeFastApiError(error);
    const data = error.response?.data as Record<string, unknown>;
    expect(data).toMatchObject({
      detail: "اعتبارسنجی ناموفق بود",
      error: "اعتبارسنجی ناموفق بود",
      message: "اعتبارسنجی ناموفق بود",
    });
  });

  it("stringifies non-string details safely", () => {
    const error = createMockAxiosError({
      detail: [{ loc: ["body", "email"], msg: "invalid", type: "value_error" }],
    });
    normalizeFastApiError(error);
    const data = error.response?.data as Record<string, unknown>;
    expect(typeof data.error).toBe("string");
    expect(data.error).toContain("email");
    expect(data.message).toBe(data.error);
  });

  it("never overwrites existing error/message fields", () => {
    const error = createMockAxiosError({
      success: false,
      error: "خطا",
      message: "پیام",
      statusCode: 400,
      detail: "ignored",
    });
    normalizeFastApiError(error);
    const data = error.response?.data as Record<string, unknown>;
    expect(data).toMatchObject({ success: false, error: "خطا", message: "پیام", statusCode: 400 });
  });

  it("leaves bodies without detail untouched", () => {
    const error = createMockAxiosError({ success: false, message: "oops" });
    normalizeFastApiError(error);
    const data = error.response?.data as Record<string, unknown>;
    expect(data).toEqual({ success: false, message: "oops" });
  });
});
