import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, resolve } from "node:path";

const derivedRoot = resolve("research", "derived");
const seedCatalogPath = resolve("research", "catalog", "seed-sources.json");
const libraryRoot = resolve("library");
const categoryOrder = ["public-domain", "research-only", "research-leads", "personal-notes"];

if (!existsSync(derivedRoot)) {
  throw new Error("No derived research directory. Ingest the local sources first.");
}

const seedCatalog = existsSync(seedCatalogPath)
  ? JSON.parse(readFileSync(seedCatalogPath, "utf8"))
  : { sources: [] };
const seedById = new Map(seedCatalog.sources.map((source) => [source.source_id, source]));

function categoryFor(manifest) {
  if (manifest.source_id.startsWith("personal-") || manifest.rights === "private") {
    return "personal-notes";
  }
  if (["youtube-transcript", "archived-web-page"].includes(manifest.kind)) {
    return "research-leads";
  }
  if (manifest.rights === "public-domain" || manifest.rights === "open-license") {
    return "public-domain";
  }
  return "research-only";
}

function parseJsonLines(path) {
  return readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(JSON.parse);
}

function exportText(pages) {
  return `${pages
    .map(({ page, text }) => {
      const marker = `===== PAGE ${String(page).padStart(4, "0")} =====`;
      const content = text.trim();
      return content ? `${marker}\n\n${content}` : marker;
    })
    .join("\n\n")}\n`;
}

for (const category of categoryOrder) {
  const categoryPath = resolve(libraryRoot, category);
  if (existsSync(categoryPath)) rmSync(categoryPath, { recursive: true });
  mkdirSync(categoryPath, { recursive: true });
}

const sources = [];
for (const sourceId of readdirSync(derivedRoot).sort()) {
  const sourceRoot = resolve(derivedRoot, sourceId);
  const manifestPath = resolve(sourceRoot, "manifest.json");
  const pagesPath = resolve(sourceRoot, "pages.jsonl");
  if (!existsSync(manifestPath) || !existsSync(pagesPath)) continue;

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const seed = seedById.get(sourceId) ?? {};
  const pages = parseJsonLines(pagesPath);
  const category = categoryFor(manifest);
  const relativeTextFile = `${category}/${sourceId}.txt`;
  const text = exportText(pages);
  const hasText = pages.some(({ text: pageText }) => pageText.trim().length > 0);
  const extractionStatus = manifest.extraction.needs_ocr
    ? "needs-ocr"
    : hasText
      ? "extracted"
      : "empty";

  writeFileSync(resolve(libraryRoot, relativeTextFile), text);
  sources.push({
    source_id: sourceId,
    title: manifest.title,
    creator: manifest.creator,
    date: manifest.date ?? seed.date ?? null,
    kind: manifest.kind ?? seed.kind ?? null,
    url: manifest.url ?? seed.url ?? null,
    evidence_tier: manifest.evidence_tier,
    rights: manifest.rights,
    category,
    extraction_status: extractionStatus,
    text_file: relativeTextFile,
    pages: manifest.extraction.pages,
    chunks: manifest.extraction.chunks,
    non_empty_characters: manifest.extraction.non_empty_characters,
    original: {
      filename: manifest.original.filename ?? basename(manifest.original.path ?? ""),
      bytes: manifest.original.bytes,
      sha256: manifest.original.sha256,
    },
    topics: manifest.topics?.length ? manifest.topics : seed.topics ?? [],
    notes: manifest.notes ?? seed.notes ?? null,
  });
}

const counts = Object.fromEntries(
  categoryOrder.map((category) => [
    category,
    sources.filter((source) => source.category === category).length,
  ]),
);

const catalog = {
  schema_version: 1,
  updated: seedCatalog.updated ?? new Date().toISOString().slice(0, 10),
  repository_visibility: "private",
  summary: {
    sources: sources.length,
    non_empty_texts: sources.filter((source) => source.extraction_status !== "empty").length,
    needs_ocr: sources.filter((source) => source.extraction_status === "needs-ocr").length,
    categories: counts,
  },
  sources,
};

mkdirSync(libraryRoot, { recursive: true });
writeFileSync(resolve(libraryRoot, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);

console.log(JSON.stringify({ output: libraryRoot, ...catalog.summary }, null, 2));
