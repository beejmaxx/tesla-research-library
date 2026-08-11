import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const libraryRoot = resolve("library");
const catalogPath = resolve(libraryRoot, "catalog.json");
const out = resolve("public", "data", "research-index.json");

if (!existsSync(catalogPath)) {
  throw new Error("No library catalog. Run `npm run research:export` first.");
}

function chunkPage(text, sourceId, page, targetWords = 700, overlapWords = 100) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  const stride = targetWords - overlapWords;
  for (let start = 0, index = 0; start < words.length; start += stride, index += 1) {
    const slice = words.slice(start, start + targetWords);
    if (!slice.length) break;
    chunks.push({
      chunk_id: `${sourceId}:p${String(page).padStart(4, "0")}:c${String(index + 1).padStart(3, "0")}`,
      source_id: sourceId,
      page,
      text: slice.join(" "),
    });
    if (start + targetWords >= words.length) break;
  }
  return chunks;
}

function readPages(path) {
  const text = readFileSync(path, "utf8");
  const markers = [...text.matchAll(/^===== PAGE (\d{4}) =====$/gm)];
  return markers.map((marker, index) => {
    const contentStart = marker.index + marker[0].length;
    const contentEnd = markers[index + 1]?.index ?? text.length;
    return {
      page: Number(marker[1]),
      text: text.slice(contentStart, contentEnd).trim(),
    };
  });
}

const sources = [];
const chunks = [];
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
for (const source of catalog.sources) {
  const textPath = resolve(libraryRoot, source.text_file);
  if (!existsSync(textPath)) continue;
  const pageRecords = readPages(textPath);
  const sourceChunks = pageRecords.flatMap(({ page, text }) => chunkPage(text, source.source_id, page));
  sources.push({
    source_id: source.source_id,
    title: source.title,
    creator: source.creator,
    evidence_tier: source.evidence_tier,
    pages: source.pages,
    chunks: sourceChunks.length,
    needs_ocr: source.extraction_status === "needs-ocr",
  });
  chunks.push(...sourceChunks);
}

mkdirSync(resolve("public", "data"), { recursive: true });
writeFileSync(out, `${JSON.stringify({ built_at: new Date().toISOString(), sources, chunks })}\n`);
console.log(JSON.stringify({ output: out, source_count: sources.length, chunk_count: chunks.length }, null, 2));
