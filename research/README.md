# Tesla research data

This directory contains the textual provenance and regeneration layer behind
the tracked archive in `../library/`.

## Source records

Every locally ingested item gets:

- a stable `source_id` and bibliographic metadata;
- an evidence tier and explicit rights label;
- the SHA-256 checksum of the exact source file;
- page-preserving text and citation chunks;
- an OCR flag when a PDF has no useful text layer.

Raw files are never silently modified. Machine paths and intermediate output
remain in ignored `research/derived/` and `research/private/` directories.

## Evidence tiers

| Tier | Meaning | Examples |
|---|---|---|
| A | Primary evidence | Tesla writing, patent, letter, lab note, contemporary court record |
| B | Strong scholarly context | Peer-reviewed history, museum catalog, critical edition |
| C | Useful secondary interpretation | Reputable biography or engineering history |
| D | Leads only | Unsourced web article, transcript, personal note, sensational claim |

Tier D material is searchable but cannot verify a claim by itself.

## Rights states

- `public-domain`: marked as public domain, subject to jurisdiction and source terms;
- `open-license`: reuse according to the named license;
- `research-only`: local study material requiring rights review;
- `unknown`: no reliable publication permission identified.

Owning a file does not automatically grant republication rights. The catalog
therefore keeps research value and copyright status as separate fields.

## Regeneration

`scripts/ingest-source.mjs` writes ignored manifests, page records, and chunks.
`scripts/ingest-tesla-leads.mjs` discovers Tesla-specific references in a local
transcript/web archive. `scripts/export-github-library.mjs` creates the path-safe
text archive. Review generated changes and rights labels before committing.
