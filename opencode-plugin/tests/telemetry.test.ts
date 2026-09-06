import test from "node:test";
import assert from "node:assert/strict";
import {
  applyFlawraRouteInferenceTelemetry,
  attachFlawraRouteTelemetryToPayload,
  attachFlawraRouteTelemetryToSseLine,
  parseFlawraRouteInferenceTelemetry,
} from "../src/telemetry.js";

test("parseFlawraRouteInferenceTelemetry: copies cost, tokens, tok/s, winning model", () => {
  const headers = new Headers({
    "X-FlawraRoute-Response-Cost": "0.0123",
    "X-FlawraRoute-Tokens-In": "10",
    "X-FlawraRoute-Tokens-Out": "200",
    "X-FlawraRoute-Tokens-Per-Second": "100.5",
    "X-FlawraRoute-Ttft-Ms": "300",
    "X-FlawraRoute-Latency-Ms": "2300",
    "X-FlawraRoute-Model": "winner-model",
    "X-FlawraRoute-Provider": "openai",
  });
  const got = parseFlawraRouteInferenceTelemetry(headers);
  assert.equal(got.costUsd, 0.0123);
  assert.equal(got.tokensIn, 10);
  assert.equal(got.tokensOut, 200);
  assert.equal(got.tokensPerSecond, 100.5);
  assert.equal(got.ttftMs, 300);
  assert.equal(got.model, "winner-model");
  assert.equal(got.provider, "openai");
});

test("parseFlawraRouteInferenceTelemetry: omits tok/s when header missing (do not invent from latency)", () => {
  const headers = new Headers({
    "X-FlawraRoute-Tokens-Out": "200",
    "X-FlawraRoute-Latency-Ms": "2000",
  });
  const got = parseFlawraRouteInferenceTelemetry(headers);
  assert.equal(got.tokensPerSecond, undefined);
  assert.equal(got.tokensOut, 200);
  const payload = attachFlawraRouteTelemetryToPayload(
    { object: "chat.completion", usage: { prompt_tokens: 10, completion_tokens: 200 } },
    got,
  ) as { usage: { tokens_per_second?: number } };
  assert.equal(payload.usage.tokens_per_second, undefined);
});

test("attachFlawraRouteTelemetryToPayload: writes usage.tokens_per_second and winning model", () => {
  const got = attachFlawraRouteTelemetryToPayload(
    {
      object: "chat.completion",
      model: "combo/auto",
      usage: { prompt_tokens: 10, completion_tokens: 200 },
    },
    { tokensPerSecond: 80, ttftMs: 250, costUsd: 0, model: "gpt-winner" },
  ) as {
    model: string;
    usage: { tokens_per_second: number; ttft_ms: number; cost: number };
  };
  assert.equal(got.model, "gpt-winner");
  assert.equal(got.usage.tokens_per_second, 80);
  assert.equal(got.usage.ttft_ms, 250);
  assert.equal(got.usage.cost, 0);
});

test("attachFlawraRouteTelemetryToPayload: does not mutate /v1/models catalog JSON", () => {
  const catalog = { object: "list", data: [{ id: "m1" }] };
  const got = attachFlawraRouteTelemetryToPayload(catalog, {
    tokensPerSecond: 99,
    model: "should-not-apply",
  });
  assert.deepEqual(got, catalog);
});

test("attachFlawraRouteTelemetryToSseLine: patches terminal usage data line", () => {
  const line =
    'data: {"object":"chat.completion.chunk","usage":{"completion_tokens":200}}';
  const got = attachFlawraRouteTelemetryToSseLine(line, { tokensPerSecond: 50 });
  assert.match(got, /"tokens_per_second":50/);
  assert.match(got, /^data: /);
});

test("applyFlawraRouteInferenceTelemetry: JSON response gets header tok/s", async () => {
  const response = new Response(
    JSON.stringify({
      object: "chat.completion",
      model: "combo/auto",
      usage: { prompt_tokens: 1, completion_tokens: 20 },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "X-FlawraRoute-Tokens-Per-Second": "40",
        "X-FlawraRoute-Model": "winner",
      },
    },
  );
  const next = await applyFlawraRouteInferenceTelemetry(response);
  const body = JSON.parse(await next.text()) as {
    model: string;
    usage: { tokens_per_second: number };
  };
  assert.equal(body.model, "winner");
  assert.equal(body.usage.tokens_per_second, 40);
});
