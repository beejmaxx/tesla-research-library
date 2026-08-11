import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error(`Invalid argument near ${key ?? "end"}`);
    out[key.slice(2)] = value;
  }
  return out;
}

function required(args, key) {
  if (!args[key]) throw new Error(`Missing --${key}`);
  return args[key];
}

function normalize(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
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
      chunk_index: index + 1,
      word_start: start + 1,
      word_end: start + slice.length,
      text: slice.join(" "),
    });
    if (start + targetWords >= words.length) break;
  }
  return chunks;
}

const args = parseArgs(process.argv.slice(2));
const file = resolve(required(args, "file"));
const sourceId = required(args, "id");
const title = required(args, "title");
const creator = args.creator ?? "Unknown";
const date = args.date ?? null;
const kind = args.kind ?? null;
const url = args.url ?? null;
const topics = (args.topics ?? "").split(",").map((topic) => topic.trim()).filter(Boolean);
const notes = args.notes ?? null;
const tier = args.tier ?? "D";
const rights = args.rights ?? "unknown";
const visibility = args.visibility ?? "private";

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sourceId)) throw new Error("--id must be a lowercase kebab-case identifier");
if (!existsSync(file)) throw new Error(`File not found: ${file}`);
if (!["A", "B", "C", "D"].includes(tier)) throw new Error("--tier must be A, B, C, or D");
if (!["public", "private"].includes(visibility)) throw new Error("--visibility must be public or private");

const extension = extname(file).toLowerCase();
const raw = readFileSync(file);
const sha256 = createHash("sha256").update(raw).digest("hex");
let pages;

if (extension === ".pdf") {
  const extracted = execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8", maxBuffer: 1024 * 1024 * 250 });
  pages = extracted.split("\f").map(normalize);
  if (!pages.at(-1)) pages.pop();
} else if (extension === ".epub") {
  const extracted = execFileSync("pandoc", [file, "-t", "plain", "--wrap=none"], { encoding: "utf8", maxBuffer: 1024 * 1024 * 250 });
  pages = [normalize(extracted)];
} else if ([".html", ".htm"].includes(extension)) {
  const extracted = execFileSync("pandoc", [file, "-f", "html", "-t", "plain", "--wrap=none"], { encoding: "utf8", maxBuffer: 1024 * 1024 * 250 });
  pages = [normalize(extracted)];
} else if ([".txt", ".md"].includes(extension)) {
  pages = [normalize(raw.toString("utf8"))];
} else {
  throw new Error(`Unsupported file type: ${extension}. Convert DOCX to PDF or text first.`);
}

const nonEmptyCharacters = pages.reduce((sum, page) => sum + page.replace(/\s/g, "").length, 0);
const needsOcr = extension === ".pdf" && nonEmptyCharacters < Math.max(500, pages.length * 80);
const pageRecords = pages.map((text, index) => ({ source_id: sourceId, page: index + 1, text }));
const chunks = pageRecords.flatMap(({ text, page }) => chunkPage(text, sourceId, page));
const outputDir = resolve("research", "derived", sourceId);
mkdirSync(outputDir, { recursive: true });

const manifest = {
  schema_version: 1,
  source_id: sourceId,
  title,
  creator,
  date,
  kind,
  url,
  topics,
  notes,
  evidence_tier: tier,
  rights,
  visibility,
  original: {
    path: file,
    filename: file.split("/").at(-1),
    extension,
    bytes: raw.byteLength,
    sha256,
  },
  extraction: {
    method: extension === ".pdf"
      ? "pdftotext-layout"
      : extension === ".epub"
        ? "pandoc-plain"
        : [".html", ".htm"].includes(extension)
          ? "pandoc-html-plain"
          : "utf8-read",
    pages: pages.length,
    chunks: chunks.length,
    non_empty_characters: nonEmptyCharacters,
    needs_ocr: needsOcr,
  },
  ingested_at: new Date().toISOString(),
};

writeFileSync(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(resolve(outputDir, "pages.jsonl"), `${pageRecords.map((record) => JSON.stringify(record)).join("\n")}\n`);
writeFileSync(resolve(outputDir, "chunks.jsonl"), `${chunks.map((chunk) => JSON.stringify(chunk)).join("\n")}\n`);

console.log(JSON.stringify({ output: outputDir, ...manifest.extraction, sha256 }, null, 2));
