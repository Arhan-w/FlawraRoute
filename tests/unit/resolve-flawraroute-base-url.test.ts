import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_FLAWRAROUTE_BASE_URL,
  resolveFlawraRouteBaseUrl,
} from "../../src/shared/utils/resolveFlawraRouteBaseUrl.ts";

test("resolveFlawraRouteBaseUrl prefers FLAWRAROUTE_BASE_URL", () => {
  assert.equal(
    resolveFlawraRouteBaseUrl({
      FLAWRAROUTE_BASE_URL: "https://internal.example.com/",
      BASE_URL: "https://base.example.com",
      NEXT_PUBLIC_BASE_URL: "https://public.example.com",
    }),
    "https://internal.example.com"
  );
});

test("resolveFlawraRouteBaseUrl falls back to BASE_URL", () => {
  assert.equal(
    resolveFlawraRouteBaseUrl({
      BASE_URL: "https://base.example.com/",
      NEXT_PUBLIC_BASE_URL: "https://public.example.com",
    }),
    "https://base.example.com"
  );
});

test("resolveFlawraRouteBaseUrl falls back to NEXT_PUBLIC_BASE_URL", () => {
  assert.equal(
    resolveFlawraRouteBaseUrl({
      NEXT_PUBLIC_BASE_URL: "https://public.example.com/",
    }),
    "https://public.example.com"
  );
});

test("resolveFlawraRouteBaseUrl ignores blank values", () => {
  assert.equal(
    resolveFlawraRouteBaseUrl({
      FLAWRAROUTE_BASE_URL: "   ",
      BASE_URL: "",
      NEXT_PUBLIC_BASE_URL: " https://public.example.com/ ",
    }),
    "https://public.example.com"
  );
});

test("resolveFlawraRouteBaseUrl uses the default localhost fallback", () => {
  assert.equal(resolveFlawraRouteBaseUrl({}), DEFAULT_FLAWRAROUTE_BASE_URL);
});
