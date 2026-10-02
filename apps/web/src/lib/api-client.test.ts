import { describe, expect, it } from "vitest";
import { ApiClient } from "./api-client";

/** ApiClient whose transport always rejects with the given response body. */
function failingGet(body: unknown, status = 422): Promise<unknown> {
  const api = new ApiClient();
  const client = api as unknown as {
    client: {
      defaults: { adapter: unknown };
      get: (url: string) => Promise<unknown>;
    };
  };
  client.client.defaults.adapter = async () => {
    const error = new Error(`Request failed with status code ${status}`) as Error & {
      response: { status: number; data: unknown; headers: Record<string, string>; config: Record<string, unknown> };
      config: Record<string, unknown>;
    };
    error.config = {};
    error.response = { status, data: body, headers: {}, config: {} };
    throw error;
  };
  return client.client.get("/ping");
}

async function rejectionBody(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return (err as { response: { data: unknown } }).response.data;
  }
  throw new Error("expected the request to be rejected");
}

describe("FastAPI error-shape normalization", () => {
  it("derives error/message from a string detail", async () => {
    const data = await rejectionBody(failingGet({ detail: "اعتبارسنجی ناموفق بود" }));
    expect(data).toMatchObject({
      detail: "اعتبارسنجی ناموفق بود",
      error: "اعتبارسنجی ناموفق بود",
      message: "اعتبارسنجی ناموفق بود",
    });
  });

  it("stringifies non-string details safely", async () => {
    const data = (await rejectionBody(
      failingGet({ detail: [{ loc: ["body", "email"], msg: "invalid", type: "value_error" }] })
    )) as Record<string, unknown>;
    expect(typeof data.error).toBe("string");
    expect(data.error).toContain("email");
    expect(data.message).toBe(data.error);
  });

  it("never overwrites existing error/message fields", async () => {
    const data = await rejectionBody(
      failingGet({ success: false, error: "خطا", message: "پیام", statusCode: 400, detail: "ignored" })
    );
    expect(data).toMatchObject({ success: false, error: "خطا", message: "پیام", statusCode: 400 });
  });

  it("leaves bodies without detail untouched", async () => {
    const data = await rejectionBody(failingGet({ success: false, message: "oops" }));
    expect(data).toEqual({ success: false, message: "oops" });
  });
});
