import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  patchBasePathLiterals,
  patchJsonManifestFile,
  patchStandaloneBasePath,
  patchProcessEnvShim,
  patchBakedAssetUrls,
} from "../../scripts/docker/patch-standalone-base-path.mjs";

test("patchBasePathLiterals rewrites empty basePath literals", () => {
  const input = 'const cfg={basePath:"",assetPrefix:void 0};"basePath":""';
  const output = patchBasePathLiterals(input, "/flawraroute");
  assert.match(output, /basePath:"\/flawraroute"/);
  assert.match(output, /"basePath":"\/flawraroute"/);
});

test("patchJsonManifestFile updates nested basePath fields", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "flawraroute-basepath-"));
  const filePath = path.join(dir, "routes-manifest.json");
  fs.writeFileSync(filePath, JSON.stringify({ basePath: "", nested: { basePath: "" } }, null, 2));
  assert.equal(patchJsonManifestFile(filePath, "/flawraroute"), true);
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  assert.equal(parsed.basePath, "/flawraroute");
  assert.equal(parsed.nested.basePath, "/flawraroute");
});

test("patchStandaloneBasePath rewrites a root-path standalone tree", () => {
  const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), "flawraroute-standalone-"));
  const distRoot = path.join(appRoot, ".build", "next");
  fs.mkdirSync(path.join(distRoot, "server"), { recursive: true });
  fs.writeFileSync(path.join(distRoot, "routes-manifest.json"), JSON.stringify({ basePath: "" }));
  fs.writeFileSync(path.join(distRoot, "server", "chunk.js"), 'export const config={basePath:""};');
  fs.writeFileSync(path.join(appRoot, "BUILD_FLAWRAROUTE_BASE_PATH"), "\n");

  const result = patchStandaloneBasePath({
    appRoot,
    fromBasePath: "",
    toBasePath: "/flawraroute",
  });

  assert.equal(result.changed, true);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(distRoot, "routes-manifest.json"), "utf8")).basePath,
    "/flawraroute"
  );
  assert.match(fs.readFileSync(path.join(distRoot, "server", "chunk.js"), "utf8"), /\/flawraroute/);
});

test("patchStandaloneBasePath rejects mismatched non-root builds", () => {
  assert.throws(
    () =>
      patchStandaloneBasePath({
        appRoot: process.cwd(),
        fromBasePath: "/custom",
        toBasePath: "/flawraroute",
      }),
    /does not match the image build/
  );
});

test("patchBasePathLiterals rewrites assetPrefix literals (Next 16 SSR asset URLs)", () => {
  // Next 16 app-router renders SSR asset URLs from assetPrefix ALONE.
  assert.equal(
    patchBasePathLiterals('{"assetPrefix":""}', "/flawraroute"),
    '{"assetPrefix":"/flawraroute"}'
  );
  assert.equal(patchBasePathLiterals('assetPrefix:""', "/flawraroute"), 'assetPrefix:"/flawraroute"');
  assert.equal(
    patchBasePathLiterals("assetPrefix:void 0", "/flawraroute"),
    'assetPrefix:"/flawraroute"'
  );
  // Asset prefix must mirror the basePath so both routing and assets align.
  const mixed = patchBasePathLiterals('{"basePath":"","assetPrefix":""}', "/flawraroute");
  assert.match(mixed, /"basePath":"\/flawraroute"/);
  assert.match(mixed, /"assetPrefix":"\/flawraroute"/);
});

test("patchBasePathLiterals rewrites the NEXT_PUBLIC env mirror", () => {
  assert.equal(
    patchBasePathLiterals('{"env":{"NEXT_PUBLIC_FLAWRAROUTE_BASE_PATH":""}}', "/flawraroute"),
    '{"env":{"NEXT_PUBLIC_FLAWRAROUTE_BASE_PATH":"/flawraroute"}}'
  );
  assert.equal(
    patchBasePathLiterals('NEXT_PUBLIC_FLAWRAROUTE_BASE_PATH:""', "/flawraroute"),
    'NEXT_PUBLIC_FLAWRAROUTE_BASE_PATH:"/flawraroute"'
  );
});

test("patchProcessEnvShim populates the Turbopack client process env", () => {
  assert.equal(
    patchProcessEnvShim("o.env={},o.argv=[]", "/flawraroute"),
    'o.env={FLAWRAROUTE_BASE_PATH:"/flawraroute",NEXT_PUBLIC_FLAWRAROUTE_BASE_PATH:"/flawraroute"},o.argv=[]'
  );
  // Non-empty env objects are left untouched (never clobber baked values).
  assert.equal(patchProcessEnvShim("o.env={A:1}", "/flawraroute"), "o.env={A:1}");
});

test("patchBakedAssetUrls prefixes absolute _next/static URLs", () => {
  assert.equal(
    patchBakedAssetUrls('"/_next/static/chunks/a.js"', "/flawraroute"),
    '"/flawraroute/_next/static/chunks/a.js"'
  );
  assert.equal(
    patchBakedAssetUrls("'/_next/static/media/m.png'", "/flawraroute"),
    "'/flawraroute/_next/static/media/m.png'"
  );
  // Already-prefixed URLs are stable.
  assert.equal(
    patchBakedAssetUrls('"/flawraroute/_next/static/a.js"', "/flawraroute"),
    '"/flawraroute/_next/static/a.js"'
  );
});
