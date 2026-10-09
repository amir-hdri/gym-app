/**
 * Lazy facade for the axios-backed API client.
 *
 * The real implementation (and therefore `axios`) lives in `./api-client` and is
 * only fetched the first time an API method is actually called. Static importers
 * (`AuthProvider`, `use-api`) therefore keep `axios` out of the critical
 * request chain of the marketing/landing routes, where no request is issued
 * before the visitor signs in.
 *
 * Every member of `ApiClient` is an `async` method, so each property access is
 * proxied to a function that resolves the module and then awaits the method.
 *
 * The proxy is generic over the property name: any method added to `ApiClient`
 * (messaging, analytics, password reset, …) is reachable here with no change to
 * this file, and `ApiClient` is the declared type so TypeScript keeps the two
 * in sync. Never turn the dynamic `import()` below into a static one — that
 * would pull `axios` back into the initial bundle of the public routes.
 */
import type { ApiClient } from "./api-client";

type AsyncApiMethod = (...args: never[]) => Promise<unknown>;

const NON_METHOD_PROPERTIES = new Set(["then", "catch", "finally", "toJSON", "constructor"]);

let clientPromise: Promise<typeof import("./api-client")> | null = null;

function loadClient() {
  clientPromise ??= import("./api-client");
  return clientPromise;
}

export const api: ApiClient = new Proxy({} as ApiClient, {
  get(_target, property) {
    if (typeof property !== "string" || NON_METHOD_PROPERTIES.has(property)) {
      return undefined;
    }

    return (...args: unknown[]) =>
      loadClient().then(({ api: client }) => {
        const method = (client as unknown as Record<string, AsyncApiMethod>)[property];
        if (typeof method !== "function") {
          throw new TypeError(`api.${property} is not a function`);
        }
        return method.apply(client, args as never[]);
      });
  },
});

export type { AuthPayload } from "./api-client";
export default api;
