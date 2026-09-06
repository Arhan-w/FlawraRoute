import test from "node:test";
import assert from "node:assert/strict";
import {
  FlawraRoutePlugin,
  FLAWRAROUTE_PROVIDER_KEY,
  DEFAULT_MODEL_CACHE_TTL_MS,
  resolveFlawraRoutePluginOptions,
} from "../src/index.js";

test("scaffold: exports public surface", () => {
  assert.equal(
    typeof FlawraRoutePlugin,
    "function",
    "FlawraRoutePlugin must be a function (Plugin factory)"
  );
  assert.equal(FLAWRAROUTE_PROVIDER_KEY, "flawraroute");
  assert.equal(DEFAULT_MODEL_CACHE_TTL_MS, 300_000);
});

test("scaffold: default export is v1 plugin shape { id, server: FlawraRoutePlugin }", async () => {
  const mod = await import("../src/index.js");
  assert.equal(typeof mod.default, "object");
  assert.equal(mod.default.id, "@flawraroute/opencode-plugin");
  assert.equal(mod.default.server, mod.FlawraRoutePlugin);
});

test("resolveFlawraRoutePluginOptions: defaults", () => {
  const r = resolveFlawraRoutePluginOptions();
  assert.equal(r.providerId, "opencode-flawraroute");
  assert.equal(r.displayName, "FlawraRoute");
  assert.equal(r.modelCacheTtl, 300_000);
  assert.equal(r.baseURL, undefined);
});

test("resolveFlawraRoutePluginOptions: custom providerId derives displayName", () => {
  const r = resolveFlawraRoutePluginOptions({ providerId: "flawraroute-preprod" });
  assert.equal(r.providerId, "opencode-flawraroute-preprod");
  assert.equal(r.displayName, "FlawraRoute (opencode-flawraroute-preprod)");
});

test("resolveFlawraRoutePluginOptions: explicit displayName wins", () => {
  const r = resolveFlawraRoutePluginOptions({
    providerId: "flawraroute-x",
    displayName: "Custom Label",
  });
  assert.equal(r.displayName, "Custom Label");
});

test("resolveFlawraRoutePluginOptions: invalid TTL falls back to default", () => {
  assert.equal(resolveFlawraRoutePluginOptions({ modelCacheTtl: 0 }).modelCacheTtl, 300_000);
  assert.equal(resolveFlawraRoutePluginOptions({ modelCacheTtl: -1 }).modelCacheTtl, 300_000);
});

test("resolveFlawraRoutePluginOptions: positive TTL respected", () => {
  assert.equal(resolveFlawraRoutePluginOptions({ modelCacheTtl: 60_000 }).modelCacheTtl, 60_000);
});

test("FlawraRoutePlugin: returns an empty hooks object (scaffold)", async () => {
  const fakeCtx = {} as Parameters<typeof FlawraRoutePlugin>[0];
  const hooks = await FlawraRoutePlugin(fakeCtx);
  assert.equal(typeof hooks, "object");
  assert.notEqual(hooks, null);
});

test("scaffold: built ESM default export resolves with the v1 plugin shape", async () => {
  // The plugin is ESM-only now — the CJS bundle was dropped to fix the OpenCode
  // loader (#3883), so there is no more ../dist/index.cjs. Validate that the built
  // distributable's default export still carries the OpenCode v1 { id, server } shape.
  const mod = await import("../dist/index.js");
  assert.strictEqual(typeof mod.default, "object");
  assert.strictEqual(mod.default.id, "@flawraroute/opencode-plugin");
  assert.strictEqual(typeof mod.default.server, "function");
});
