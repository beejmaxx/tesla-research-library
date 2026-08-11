# Tesla Research Library

A private, searchable archive of the Tesla material collected on this machine.
The repository keeps readable text exports, source metadata, evidence tiers,
rights notes, and a small local reading-room app in one place.

## What is included

- 71 source records and 70 non-empty text exports;
- 2 public-domain works;
- 12 research-only books, papers, patent compilations, and web printouts;
- 52 low-confidence research leads from locally saved YouTube transcripts and
  archived web pages;
- 5 personal-note files, including one empty placeholder preserved in the catalog;
- page markers, checksums, and original filenames without machine-local paths;
- one retained copy from each exact-duplicate group;
- a searchable browser that builds its index from the tracked text archive.

Start with [`library/README.md`](library/README.md) for the archive layout and
[`library/catalog.json`](library/catalog.json) for the complete machine-readable
inventory.

> **Keep this repository private.** The `research-only` directory contains
> extracted text from works that have not been cleared for public
> redistribution. A private research copy is not a public-domain determination.

## Library layout

```text
library/
  catalog.json        source, rights, extraction, and checksum metadata
  public-domain/      rights-cleared historical texts
  research-only/      private study copies; do not publish without review
  research-leads/     transcripts and archived pages that merely point to claims
  personal-notes/     locally collected notes and research leads
research/
  catalog/            curated source map and evidence policy
  derived/            ignored local ingest output with private paths
scripts/
  ingest-source.mjs   extract a local PDF, EPUB, Markdown, or text file
  ingest-tesla-leads.mjs
                      find Tesla references in a local transcript/web archive
  export-github-library.mjs
                      create path-safe text exports for the private repository
  build-research-index.mjs
                      build the browser's local full-text index
```

## Run the reading room

Node.js 22.13 or newer is required.

```bash
npm ci
npm run dev
```

The development and production builds regenerate `public/data/research-index.json`
from `library/`. That generated index is ignored by Git because it duplicates
the tracked text archive.

## Add another source

```bash
npm run research:ingest -- \
  --file "/path/to/source.pdf" \
  --id stable-kebab-case-id \
  --title "Source title" \
  --creator "Creator name" \
  --tier A \
  --rights research-only \
  --visibility private

npm run research:export
npm run research:index
```

Review the generated catalog entry and rights label before committing. PDF
scans without usable embedded text are marked `needs-ocr` rather than treated
as complete.
