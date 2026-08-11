import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const libraryRoot = new URL("../library/", import.meta.url);

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, root), "utf8"));
}

test("catalogs every collected source without machine-local paths", async () => {
  const catalogText = await readFile(new URL("catalog.json", libraryRoot), "utf8");
  const catalog = JSON.parse(catalogText);

  assert.equal(catalog.repository_visibility, "public");
  assert.equal(catalog.summary.sources, 71);
  assert.equal(catalog.summary.non_empty_texts, 70);
  assert.equal(catalog.summary.needs_ocr, 2);
  assert.deepEqual(catalog.summary.categories, {
    "public-domain": 2,
    "research-only": 12,
    "research-leads": 52,
    "personal-notes": 5,
  });
  assert.doesNotMatch(catalogText, /\/Users\/|[A-Z]:\\Users\\/);
});

test("keeps one page-preserving text export for every catalog entry", async () => {
  const catalog = await readJson("library/catalog.json");

  for (const source of catalog.sources) {
    const textUrl = new URL(source.text_file, libraryRoot);
    await access(textUrl);
    const text = await readFile(textUrl, "utf8");
    const pageMarkers = text.match(/^===== PAGE \d{4} =====$/gm) ?? [];

    assert.equal(pageMarkers.length, source.pages, source.source_id);
    assert.equal(source.original.sha256.length, 64, source.source_id);
  }
});

test("builds a complete searchable index from the tracked archive", async () => {
  const index = await readJson("public/data/research-index.json");
  const indexedChunks = index.sources.reduce((sum, source) => sum + source.chunks, 0);

  assert.equal(index.sources.length, 71);
  assert.equal(index.chunks.length, 3076);
  assert.equal(indexedChunks, index.chunks.length);
  assert.ok(index.chunks.some((chunk) => /magnifying transmitter/i.test(chunk.text)));
});

test("server-renders the Tesla reading room", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Tesla Study — Personal Knowledge Base/);
  assert.match(html, /Understand the work/);
  assert.match(html, /Search your library/);
});
