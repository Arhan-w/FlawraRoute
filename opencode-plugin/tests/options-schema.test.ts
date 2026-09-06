/**
 * T-08 options-schema tests.
 *
 * Covers `parseFlawraRoutePluginOptions(opts)` — the strict Zod gate that
 * validates the second-arg `PluginOptions` bag from opencode.json before
 * any hook is wired. Anti-pattern checklist mirrored here:
 *
 *  - `null` / `undefined` must collapse to `{}` (defaults apply downstream).
 *  - Unknown keys must THROW (`.strict()` catches opencode.json typos).
 *  - Validation runs at parse time, not import time (module loads cleanly).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { parseFlawraRoutePluginOptions } from "../src/index.js";

test("parseFlawraRoutePluginOptions: undefined → {}", () => {
  assert.deepEqual(parseFlawraRoutePluginOptions(undefined), {});
});

test("parseFlawraRoutePluginOptions: null → {}", () => {
  assert.deepEqual(parseFlawraRoutePluginOptions(null), {});
});

test("parseFlawraRoutePluginOptions: empty object → {}", () => {
  assert.deepEqual(parseFlawraRoutePluginOptions({}), {});
});

test("parseFlawraRoutePluginOptions: valid providerId → returns it", () => {
  const r = parseFlawraRoutePluginOptions({ providerId: "flawraroute-preprod" });
  assert.equal(r.providerId, "flawraroute-preprod");
});

test("parseFlawraRoutePluginOptions: invalid providerId (special chars) → throws", () => {
  assert.throws(
    () => parseFlawraRoutePluginOptions({ providerId: "flawraroute prod!" }),
    /providerId.*slug/i
  );
});

test("parseFlawraRoutePluginOptions: empty providerId → throws", () => {
  assert.throws(() => parseFlawraRoutePluginOptions({ providerId: "" }), /providerId/i);
});

test("parseFlawraRoutePluginOptions: valid modelCacheTtl → returns it", () => {
  const r = parseFlawraRoutePluginOptions({ modelCacheTtl: 60_000 });
  assert.equal(r.modelCacheTtl, 60_000);
});

test("parseFlawraRoutePluginOptions: negative modelCacheTtl → throws", () => {
  assert.throws(() => parseFlawraRoutePluginOptions({ modelCacheTtl: -1 }), /modelCacheTtl/i);
});

test("parseFlawraRoutePluginOptions: zero modelCacheTtl → throws (positive required)", () => {
  assert.throws(() => parseFlawraRoutePluginOptions({ modelCacheTtl: 0 }), /modelCacheTtl/i);
});

test("parseFlawraRoutePluginOptions: invalid baseURL (not a URL) → throws", () => {
  assert.throws(() => parseFlawraRoutePluginOptions({ baseURL: "not-a-url" }), /baseURL/i);
});

test("parseFlawraRoutePluginOptions: unknown key → throws (strict mode catches typos)", () => {
  assert.throws(
    () =>
      parseFlawraRoutePluginOptions({
        providerId: "flawraroute",
        provider_id: "typo-here",
      }),
    /provider_id|unrecognized/i
  );
});

test("parseFlawraRoutePluginOptions: all four fields populated correctly → returns them", () => {
  const opts = {
    providerId: "flawraroute-prod",
    displayName: "FlawraRoute Production",
    modelCacheTtl: 120_000,
    baseURL: "https://or.example.com/v1",
  };
  const r = parseFlawraRoutePluginOptions(opts);
  assert.deepEqual(r, opts);
});

test("parseFlawraRoutePluginOptions: error message lists every issue path", () => {
  // Two bad fields at once → error string should mention BOTH.
  try {
    parseFlawraRoutePluginOptions({
      providerId: "",
      baseURL: "garbage",
    });
    assert.fail("expected throw");
  } catch (err) {
    const msg = (err as Error).message;
    assert.match(msg, /providerId/);
    assert.match(msg, /baseURL/);
  }
});

test("parseFlawraRoutePluginOptions: module import alone does NOT throw", async () => {
  // Re-importing the entry must not trigger validation; validation only fires
  // on explicit parseFlawraRoutePluginOptions / FlawraRoutePlugin invocation.
  const mod = await import("../src/index.js");
  assert.equal(typeof mod.parseFlawraRoutePluginOptions, "function");
});
