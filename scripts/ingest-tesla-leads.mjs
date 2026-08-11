import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

const transcriptRoot = process.env.TESLA_TRANSCRIPT_ROOT;
const webArchiveRoot = process.env.TESLA_WEB_ARCHIVE_ROOT;
const ingestScript = resolve("scripts", "ingest-source.mjs");
const teslaTerms = /Nikola Tesla|Tesla coil|Tesla turbine|Wardenclyffe|magnifying transmitter/i;

if (!transcriptRoot && !webArchiveRoot) {
  throw new Error("Set TESLA_TRANSCRIPT_ROOT and/or TESLA_WEB_ARCHIVE_ROOT.");
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dateFromYoutube(value) {
  if (!/^\d{8}$/.test(value ?? "")) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function ingest(options) {
  const args = [];
  for (const [key, value] of Object.entries(options)) {
    if (value !== null && value !== undefined && value !== "") args.push(`--${key}`, String(value));
  }
  execFileSync(process.execPath, [ingestScript, ...args], { stdio: "inherit" });
}

let transcriptCount = 0;
if (transcriptRoot) {
  const textRoot = resolve(transcriptRoot, "txt");
  const rawRoot = resolve(transcriptRoot, "raw");
  if (!existsSync(textRoot) || !existsSync(rawRoot)) {
    throw new Error("TESLA_TRANSCRIPT_ROOT must contain txt/ and raw/ directories.");
  }
  const rawFiles = readdirSync(rawRoot);

  for (const filename of readdirSync(textRoot).filter((name) => name.endsWith(".txt")).sort()) {
    const file = resolve(textRoot, filename);
    if (!teslaTerms.test(readFileSync(file, "utf8"))) continue;

    const videoId = basename(filename, ".txt");
    const infoFilename = rawFiles.find((name) => name.endsWith(`[${videoId}].info.json`));
    const info = infoFilename
      ? JSON.parse(readFileSync(resolve(rawRoot, infoFilename), "utf8"))
      : {};

    ingest({
      file,
      id: `youtube-${slug(videoId)}`,
      title: info.title ?? `YouTube transcript ${videoId}`,
      creator: info.channel ?? info.uploader ?? "Unknown YouTube channel",
      date: dateFromYoutube(info.upload_date),
      kind: "youtube-transcript",
      url: info.webpage_url ?? `https://www.youtube.com/watch?v=${videoId}`,
      topics: "youtube-transcript,tesla-mention,research-lead",
      notes: "Locally saved transcript containing Tesla-related terms. Treat as a research lead, not verified evidence.",
      tier: "D",
      rights: "research-only",
      visibility: "private",
    });
    transcriptCount += 1;
  }
}

let webCount = 0;
if (webArchiveRoot) {
  if (!existsSync(webArchiveRoot)) throw new Error("TESLA_WEB_ARCHIVE_ROOT does not exist.");

  for (const filename of readdirSync(webArchiveRoot).filter((name) => /teslas?.*\.html?$/i.test(name)).sort()) {
    const file = resolve(webArchiveRoot, filename);
    const html = readFileSync(file, "utf8");
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const fallbackTitle = basename(filename, extname(filename)).replaceAll("-", " ");
    const title = (titleMatch?.[1] ?? fallbackTitle).replace(/\s+/g, " ").trim();

    ingest({
      file,
      id: `web-reformation-${slug(basename(filename, extname(filename)))}`,
      title,
      creator: "Reformation.org web archive",
      kind: "archived-web-page",
      url: `https://www.reformation.org/${filename}`,
      topics: "archived-web-page,tesla,research-lead",
      notes: "Locally archived web page. Treat as an unverified lead and check its claims against primary sources.",
      tier: "D",
      rights: "research-only",
      visibility: "private",
    });
    webCount += 1;
  }
}

console.log(JSON.stringify({ transcript_count: transcriptCount, web_page_count: webCount }, null, 2));
