import test from "node:test";
import assert from "node:assert/strict";

import {
  attachFlawraRouteMetaHeaders,
  buildFlawraRouteResponseMetaHeaders,
  buildFlawraRouteSseMetadataComment,
  formatFlawraRouteCost,
  getFlawraRouteTokenCounts,
} from "../../src/domain/flawrarouteResponseMeta.ts";
import { APP_CONFIG } from "../../src/shared/constants/appConfig.ts";
import { FLAWRAROUTE_RESPONSE_HEADERS } from "../../src/shared/constants/headers.ts";

test("getFlawraRouteTokenCounts normalizes common usage shapes", () => {
  assert.deepEqual(
    getFlawraRouteTokenCounts({
      prompt_tokens: 12,
      completion_tokens: 5,
    }),
    { input: 12, output: 5 }
  );
  assert.deepEqual(
    getFlawraRouteTokenCounts({
      input_tokens: "9",
      output_tokens: "4",
    }),
    { input: 9, output: 4 }
  );
});

test("buildFlawraRouteResponseMetaHeaders formats provider alias, tokens, latency, and cost", () => {
  const headers = buildFlawraRouteResponseMetaHeaders({
    provider: "claude",
    model: "claude-sonnet-4-6",
    cacheHit: true,
    latencyMs: 1234.6,
    usage: {
      prompt_tokens: 11,
      completion_tokens: 7,
    },
    costUsd: 0.00123456789,
  });

  assert.equal(headers["X-FlawraRoute-Provider"], "cc");
  assert.equal(headers["X-FlawraRoute-Model"], "claude-sonnet-4-6");
  assert.equal(headers["X-FlawraRoute-Cache-Hit"], "true");
  assert.equal(headers["X-FlawraRoute-Latency-Ms"], "1235");
  assert.equal(headers["X-FlawraRoute-Tokens-In"], "11");
  assert.equal(headers["X-FlawraRoute-Tokens-Out"], "7");
  assert.equal(headers["X-FlawraRoute-Response-Cost"], "0.0012345679");
});

test("buildFlawraRouteResponseMetaHeaders keeps ASCII model header values unchanged", () => {
  const headers = buildFlawraRouteResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  assert.equal(headers[FLAWRAROUTE_RESPONSE_HEADERS.model], "gpt-4o-mini");
});

test("buildFlawraRouteResponseMetaHeaders percent-encodes non-ASCII model header values", () => {
  const model = "free-mix/[假流式]gemini-3.7-flash";
  const headers = buildFlawraRouteResponseMetaHeaders({
    provider: "openai",
    model,
  });

  assert.equal(headers[FLAWRAROUTE_RESPONSE_HEADERS.model], encodeURIComponent(model));
  assert.doesNotThrow(() => new Headers(headers));
});

test("buildFlawraRouteResponseMetaHeaders strips control characters from string header values", () => {
  const headers = buildFlawraRouteResponseMetaHeaders({
    provider: "openai",
    model: "free\r\nX-Injected: yes\u0000-model",
    requestId: "req-1\nreq-2\rreq-3\u0007",
  });

  assert.doesNotMatch(headers[FLAWRAROUTE_RESPONSE_HEADERS.model], /[\r\n\u0000-\u001f\u007f]/);
  assert.doesNotMatch(headers[FLAWRAROUTE_RESPONSE_HEADERS.requestId], /[\r\n\u0000-\u001f\u007f]/);
  assert.equal(headers[FLAWRAROUTE_RESPONSE_HEADERS.model], "freeX-Injected: yes-model");
  assert.equal(headers[FLAWRAROUTE_RESPONSE_HEADERS.requestId], "req-1req-2req-3");
  assert.doesNotThrow(() => new Headers(headers));
});

test("buildFlawraRouteResponseMetaHeaders always emits X-FlawraRoute-Version", () => {
  const headers = buildFlawraRouteResponseMetaHeaders({ provider: "openai", model: "gpt" });
  assert.equal(headers[FLAWRAROUTE_RESPONSE_HEADERS.version], APP_CONFIG.version);

  // Even with no provider/model at all, the version is still attached.
  const bare = buildFlawraRouteResponseMetaHeaders({});
  assert.equal(bare[FLAWRAROUTE_RESPONSE_HEADERS.version], APP_CONFIG.version);
});

test("buildFlawraRouteResponseMetaHeaders emits X-FlawraRoute-Request-Id only when provided", () => {
  const withId = buildFlawraRouteResponseMetaHeaders({ model: "gpt", requestId: "req-123" });
  assert.equal(withId[FLAWRAROUTE_RESPONSE_HEADERS.requestId], "req-123");

  const noId = buildFlawraRouteResponseMetaHeaders({ model: "gpt" });
  assert.equal(noId[FLAWRAROUTE_RESPONSE_HEADERS.requestId], undefined);

  const nullId = buildFlawraRouteResponseMetaHeaders({ model: "gpt", requestId: null });
  assert.equal(nullId[FLAWRAROUTE_RESPONSE_HEADERS.requestId], undefined);

  const blankId = buildFlawraRouteResponseMetaHeaders({ model: "gpt", requestId: "   " });
  assert.equal(blankId[FLAWRAROUTE_RESPONSE_HEADERS.requestId], undefined);
});

test("attachFlawraRouteMetaHeaders mutates a Headers instance in place, preserving existing entries", () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  attachFlawraRouteMetaHeaders(headers, {
    provider: "openai",
    model: "gpt",
    requestId: "req-abc",
  });

  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(headers.get(FLAWRAROUTE_RESPONSE_HEADERS.version), APP_CONFIG.version);
  assert.equal(headers.get(FLAWRAROUTE_RESPONSE_HEADERS.requestId), "req-abc");
  assert.equal(headers.get(FLAWRAROUTE_RESPONSE_HEADERS.model), "gpt");
});

test("attachFlawraRouteMetaHeaders mutates a plain record in place, preserving existing entries", () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  attachFlawraRouteMetaHeaders(headers, {
    provider: "openai",
    model: "gpt",
  });

  assert.equal(headers["Content-Type"], "application/json");
  assert.equal(headers[FLAWRAROUTE_RESPONSE_HEADERS.version], APP_CONFIG.version);
  assert.equal(headers[FLAWRAROUTE_RESPONSE_HEADERS.model], "gpt");
  // No requestId provided → header omitted.
  assert.equal(headers[FLAWRAROUTE_RESPONSE_HEADERS.requestId], undefined);
});

test("buildFlawraRouteSseMetadataComment emits comment lines compatible with SSE", () => {
  const comment = buildFlawraRouteSseMetadataComment({
    provider: "openai",
    model: "gpt-4o-mini",
    usage: {
      prompt_tokens: 4,
      completion_tokens: 2,
    },
    latencyMs: 50,
    costUsd: formatFlawraRouteCost(0),
  });

  assert.match(comment, /^: x-flawraroute-cache-hit=false/m);
  assert.match(comment, /^: x-flawraroute-provider=openai/m);
  assert.match(comment, /^: x-flawraroute-model=gpt-4o-mini/m);
  assert.match(comment, /^: x-flawraroute-tokens-in=4/m);
  assert.match(comment, /^: x-flawraroute-tokens-out=2/m);
  assert.match(comment, /^: x-flawraroute-response-cost=0\.0000000000/m);
});

test("buildFlawraRouteResponseMetaHeaders emits X-FlawraRoute-Cost-Saved only when costSavedUsd is provided", () => {
  // Cache HIT: the incremental cost of serving the hit is 0, but the cache saved the
  // original (would-have-been) cost — surfaced via the Cost-Saved header for analytics.
  const hit = buildFlawraRouteResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o",
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0.0125,
  });
  assert.equal(hit[FLAWRAROUTE_RESPONSE_HEADERS.responseCost], "0.0000000000");
  assert.equal(hit[FLAWRAROUTE_RESPONSE_HEADERS.costSaved], "0.0125000000");

  // A normal response (no costSavedUsd) omits the Cost-Saved header entirely.
  const miss = buildFlawraRouteResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o",
    costUsd: 0.0125,
  });
  assert.equal(miss[FLAWRAROUTE_RESPONSE_HEADERS.costSaved], undefined);

  // A free-model HIT still emits Cost-Saved (= 0) — it explicitly passed costSavedUsd.
  const freeHit = buildFlawraRouteResponseMetaHeaders({
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0,
  });
  assert.equal(freeHit[FLAWRAROUTE_RESPONSE_HEADERS.costSaved], "0.0000000000");
});

test("attachFlawraRouteMetaHeaders forwards costSavedUsd onto a Headers bag", () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  attachFlawraRouteMetaHeaders(headers, {
    provider: "openai",
    model: "gpt-4o",
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0.0125,
  });
  assert.equal(headers.get(FLAWRAROUTE_RESPONSE_HEADERS.responseCost), "0.0000000000");
  assert.equal(headers.get(FLAWRAROUTE_RESPONSE_HEADERS.costSaved), "0.0125000000");
});
