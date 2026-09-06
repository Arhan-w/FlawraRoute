/**
 * Regression test for #6859.
 *
 * `resolveFlawraRoutePluginOptions()` auto-prefixes `providerId` with
 * `"opencode-"` (commit 75b52e286) so OpenCode 1.17.8+'s native-adapter gate
 * accepts it as an OC-registered provider id. That prefixed value must stay
 * OC-internal (AuthHook.provider / provider registration keys) — it must
 * NEVER leak into the identifiers FlawraRoute's own server parses to resolve
 * credentials (`mapRawModelToModelV2`'s `id`/`providerID`,
 * `mapComboToModelV2`'s `providerID`, and the dynamic-hook catalog keys).
 *
 * FlawraRoute's server-side `parseModel()` (open-sse/services/model.ts) splits
 * a dispatched model string on `/` to recover the provider name and look up
 * credentials. If the plugin embeds the OC-gate-prefixed id in that string,
 * the server looks up credentials for a provider named "opencode-flawraroute"
 * (which never exists in `src/shared/constants/providers.ts`) instead of
 * "flawraroute" — producing the exact "No credentials for opencode-flawraroute" /
 * "No active credentials for provider: opencode-flawraroute" errors reported
 * in #6859.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStaticProviderEntry,
  createFlawraRouteProviderHook,
  mapRawModelToModelV2,
  resolveFlawraRoutePluginOptions,
  type FlawraRouteRawCombo,
} from "../src/index.js";

/**
 * Minimal stand-in for FlawraRoute's own `parseModel()` (open-sse/services/
 * model.ts), which splits a dispatched `<providerID>/<modelID>` string on the
 * FIRST "/" to recover the provider name used for credential lookup. Kept
 * local (rather than cross-importing the real module) so this package's
 * self-contained test suite (`cd @flawraroute/opencode-plugin && npm test`)
 * doesn't depend on the root repo's `@/*` path-alias resolution.
 */
function splitProviderFromDispatchedModel(modelStr: string): string {
  const idx = modelStr.indexOf("/");
  return idx === -1 ? modelStr : modelStr.slice(0, idx);
}

const apiAuth = (key: string) => ({ type: "api" as const, key });

test("#6859: server-facing model id/providerID must resolve to the unprefixed provider name", () => {
  const resolved = resolveFlawraRoutePluginOptions();

  // The OC-gate-compatible id stays prefixed — it is legitimate for
  // AuthHook.provider / provider registration.
  assert.equal(resolved.providerId, "opencode-flawraroute");

  // A second, unprefixed id must be exposed for anything that reaches
  // FlawraRoute's own server (model id prefix, ModelV2.providerID, combo keys).
  assert.equal(
    resolved.flawrarouteProviderId,
    "flawraroute",
    "resolveFlawraRoutePluginOptions() must expose an unprefixed flawrarouteProviderId"
  );

  // A bare raw /v1/models entry (no existing "/" in its id — the common
  // case for FlawraRoute's catalog) mapped with the server-facing id.
  const model = mapRawModelToModelV2(
    { id: "claude-opus-4-7" },
    { providerId: resolved.flawrarouteProviderId, baseURL: "http://localhost:20128" }
  );

  assert.equal(model.providerID, "flawraroute");
  assert.equal(model.id, "flawraroute/claude-opus-4-7");

  // OpenCode dispatches back to FlawraRoute using `providerID/modelKey`
  // (matches the issue's own repro: `-m opencode-flawraroute/oc/big-pickle`).
  const dispatchedModelString = `${model.providerID}/claude-opus-4-7`;
  const parsedProvider = splitProviderFromDispatchedModel(dispatchedModelString);

  assert.equal(
    parsedProvider,
    "flawraroute",
    `server-side provider split resolved '${parsedProvider}', expected 'flawraroute' — ` +
      `credentials lookup would fail for an OC-gate-prefixed provider id`
  );
});

test("#6859: createFlawraRouteProviderHook end-to-end — catalog keys/providerID never carry the OC-gate prefix", async () => {
  const hook = createFlawraRouteProviderHook(
    { baseURL: "https://or.example.com/v1" },
    {
      fetcher: async () => [{ id: "claude-opus-4-7" }],
      combosFetcher: async () => [],
    }
  );
  const out = await hook.models!({} as never, { auth: apiAuth("sk-test") as never });
  const model = out["flawraroute/claude-opus-4-7"];
  assert.ok(model, "catalog keyed under the unprefixed provider name");
  assert.equal(model.providerID, "flawraroute");
  assert.ok(
    !model.providerID.startsWith("opencode-"),
    "the OC-gate prefix must never leak into ModelV2.providerID"
  );
});

// #7976: buildStaticProviderEntry (the STATIC provider() config-hook path,
// exercised when the plugin writes `opencode.json` up front rather than
// registering the dynamic `provider.models()` hook) never received the
// #6859 fix. OC dispatches a static-catalog `models` map key verbatim as
// the `model` field of the outbound request — only the top-level
// `provider["<id>"]` segment is stripped for routing — so a bare-slug combo
// key built with the OC-gated `providerId` reaches FlawraRoute's server
// doubled and fails credential lookup for the nonexistent provider
// `opencode-flawraroute`. Confirmed against the issue's own curl repro
// (`model: "opencode-flawraroute/hermes-smart-stack"` → "No active
// credentials for provider: opencode-flawraroute").
// #9175 tightened this further: OC's `getModel` looks models up by BARE id,
// so combo dict keys now carry NO prefix at all (not even `flawraroute/`).
test("#7976/#9175: buildStaticProviderEntry keys combos by bare slug (no prefix at all — never the OC-gate providerId)", () => {
  const resolved = resolveFlawraRoutePluginOptions({ providerId: "flawraroute" });
  assert.equal(resolved.providerId, "opencode-flawraroute");
  assert.equal(resolved.flawrarouteProviderId, "flawraroute");

  const combo = {
    id: "combo-abc123",
    name: "Hermes Smart Stack",
    isHidden: false,
    models: [],
  } as unknown as FlawraRouteRawCombo;

  const block = buildStaticProviderEntry(
    [],
    [combo],
    resolved,
    "https://or.example/v1",
    "sk-test"
  );

  assert.deepEqual(Object.keys(block.models), ["hermes-smart-stack"]);
  assert.equal(
    block.models["opencode-flawraroute/hermes-smart-stack"],
    undefined,
    "combo key must not carry the OC-gate-prefixed providerId — it doubles up once " +
      "OC dispatches it verbatim as the `model` field"
  );
});
