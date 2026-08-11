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

test("keeps one page-preserving text record for every catalog entry", async () => {
  const catalog = await readJson("library/catalog.json");

  for (const source of catalog.sources) {
    const textUrl = new URL(source.text_file, libraryRoot);
    await access(textUrl);
    const text = await readFile(textUrl, "utf8");
    const pageMarkers = text.match(/^===== PAGE \d{4} =====$/gm) ?? [];

    assert.equal(pageMarkers.length, source.pages, source.source_id);
    assert.match(source.original.sha256, /^[a-f0-9]{64}$/, source.source_id);
  }
});

test("preserves category and evidence separation", async () => {
  const catalog = await readJson("library/catalog.json");
  const publicDomain = catalog.sources.filter((source) => source.category === "public-domain");
  const leads = catalog.sources.filter((source) => source.category === "research-leads");

  assert.equal(publicDomain.length, 2);
  assert.ok(publicDomain.every((source) => source.evidence_tier === "A"));
  assert.equal(leads.length, 52);
  assert.ok(leads.every((source) => source.evidence_tier === "D"));
});

test("retains directly searchable Tesla corpus text", async () => {
  const inventions = await readFile(new URL("public-domain/tesla-my-inventions-1919.txt", libraryRoot), "utf8");
  const martin = await readFile(new URL("public-domain/martin-inventions-researches-1894.txt", libraryRoot), "utf8");

  assert.match(inventions, /magnifying transmitter/i);
  assert.match(martin, /rotating magnetic field/i);
});
