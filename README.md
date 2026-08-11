# Tesla Research Library

## Interactive model

Open `index.html` in a browser to explore the first teaching model: Tesla's AC
induction motor. The self-contained page visualizes the two phase currents,
rotating resultant field, rotor slip, frequency, pole count, load, and phase
reversal without requiring a build step.

A public, GitHub-native text archive of the Tesla material collected on this
machine. The repository keeps readable text exports, page markers, source
metadata, evidence tiers, rights notes, checksums, and lightweight maintenance
scripts—without a website framework or dependency stack.

Start with the [`library` guide](library/README.md) and the complete
machine-readable [`source catalog`](library/catalog.json).

> **Rights and accuracy notice:** `research-only`, `research-leads`, and
> `personal-notes` contain material that has not been cleared for unrestricted
> redistribution. Inclusion is not a public-domain or factual-accuracy
> determination. Tier-D leads cannot support claims without stronger evidence.

## Contents

- 71 source records and 70 non-empty text exports;
- 2 public-domain works;
- 12 research-only books, papers, patent compilations, and web printouts;
- 52 low-confidence research leads from locally saved transcripts and archived pages;
- 5 personal-note files, including one intentionally preserved empty placeholder;
- page markers, checksums, rights labels, and original filenames without machine paths;
- one retained copy from each exact SHA-256 duplicate group;
- extraction and integrity-check scripts requiring no npm packages.

## Layout

```text
library/
  catalog.json        source, rights, extraction, and checksum metadata
  public-domain/      rights-cleared historical texts
  research-only/      study copies whose rights require review
  research-leads/     transcripts and archived pages that point to claims
  personal-notes/     locally collected notes and research leads
research/
  catalog/            curated source map and evidence policy
  derived/            ignored local extraction output with private paths
scripts/
  ingest-source.mjs   extract and hash a PDF, EPUB, HTML, Markdown, or text file
  ingest-tesla-leads.mjs
                      discover Tesla references in a local transcript archive
  export-github-library.mjs
                      create the path-safe tracked text archive
tests/
  library.test.mjs    corpus and privacy integrity checks
```

## Read and search

GitHub renders and searches the tracked text directly. After cloning, use
[`ripgrep`](https://github.com/BurntSushi/ripgrep) for fast local search:

```bash
rg -n -i 'magnifying transmitter' library/
rg -l -i 'rotating magnetic field' library/
```

Results retain markers such as `===== PAGE 0042 =====`, referring to the source
PDF page sequence.

## Validate the archive

The tests use only Node.js built-ins:

```bash
node --test tests/library.test.mjs
```

## Add another source

PDF extraction requires `pdftotext` from Poppler; EPUB and HTML extraction uses
Pandoc.

```bash
node scripts/ingest-source.mjs \
  --file "/path/to/source.pdf" \
  --id stable-kebab-case-id \
  --title "Source title" \
  --creator "Creator name" \
  --tier A \
  --rights research-only \
  --visibility private

node scripts/export-github-library.mjs
node --test tests/library.test.mjs
```

Review the rights label before publishing. Scans without usable embedded text
are marked `needs-ocr` rather than treated as complete transcriptions.
