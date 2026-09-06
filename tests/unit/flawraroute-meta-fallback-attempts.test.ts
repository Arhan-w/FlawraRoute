import test from "node:test";
import assert from "node:assert/strict";
import { FLAWRAROUTE_RESPONSE_HEADERS } from "../../src/shared/constants/headers.ts";
import { buildFlawraRouteResponseMetaHeaders } from "../../src/domain/flawrarouteResponseMeta.ts";

test("headers constant exposes the fallback-attempts key", () => {
  assert.equal(
    FLAWRAROUTE_RESPONSE_HEADERS.fallbackAttempts,
    "X-FlawraRoute-Fallback-Attempts"
  );
});

test("buildFlawraRouteResponseMetaHeaders emits the fallback-attempts count when > 0", () => {
  const h = buildFlawraRouteResponseMetaHeaders({ model: "gpt", provider: "openai", fallbackAttempts: 2 });
  assert.equal(h["X-FlawraRoute-Fallback-Attempts"], "2");
});

test("buildFlawraRouteResponseMetaHeaders omits the header when 0 / absent", () => {
  const none = buildFlawraRouteResponseMetaHeaders({ model: "gpt" });
  assert.equal(none["X-FlawraRoute-Fallback-Attempts"], undefined);
  const zero = buildFlawraRouteResponseMetaHeaders({ model: "gpt", fallbackAttempts: 0 });
  assert.equal(zero["X-FlawraRoute-Fallback-Attempts"], undefined);
});
