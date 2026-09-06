import test from "node:test";
import assert from "node:assert/strict";

const opencodeConfig = await import("../../src/shared/services/opencodeConfig.ts");

test("buildOpenCodeConfigDocument includes both V1 (provider) and V2 (providers) definitions", () => {
  const doc = opencodeConfig.buildOpenCodeConfigDocument({
    baseUrl: "http://localhost:20128/v1",
    apiKey: "{env:FLAWRAROUTE_API_KEY}",
    models: ["auto/best-coding"],
  });

  assert.ok(doc.provider?.flawraroute, "V1 provider.flawraroute must be present");
  assert.equal(doc.provider.flawraroute.npm, "@ai-sdk/openai-compatible");
  assert.equal(doc.provider.flawraroute.options.baseURL, "http://localhost:20128/v1");

  assert.ok(doc.providers?.flawraroute, "V2 providers.flawraroute must be present");
  assert.equal(doc.providers.flawraroute.package, "@opencode-ai/ai/providers/openai-compatible");
  assert.equal(doc.providers.flawraroute.settings.baseURL, "http://localhost:20128/v1");
  assert.equal(doc.providers.flawraroute.settings.apiKey, "{env:FLAWRAROUTE_API_KEY}");
  assert.ok(doc.providers.flawraroute.models["auto/best-coding"].limit, "V2 model limit must be present");
});

test("mergeOpenCodeConfig preserves existing properties and updates both provider and providers", () => {
  const existing = {
    $schema: "https://opencode.ai/config.json",
    customField: "keep-me",
  };

  const merged = opencodeConfig.mergeOpenCodeConfig(existing, {
    baseUrl: "http://localhost:20128/v1",
    apiKey: "sk_test_key",
    models: ["auto/best-coding"],
  });

  assert.equal(merged.customField, "keep-me");
  assert.ok(merged.provider?.flawraroute);
  assert.ok(merged.providers?.flawraroute);
  assert.equal(merged.providers.flawraroute.settings.apiKey, "sk_test_key");
});
