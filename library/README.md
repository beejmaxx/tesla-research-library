# Library guide

This directory is the GitHub-safe text export of the local Tesla collection.
Each source has one UTF-8 file with explicit page markers. The catalog records
title, creator, evidence tier, rights state, extraction status, original
filename, size, and SHA-256 checksum—but never a local machine path.

## Categories

| Directory | Contents | Publishing rule |
|---|---|---|
| `public-domain/` | Historical works marked public domain | Check jurisdiction and source terms before reuse |
| `research-only/` | Copyrighted, uncertain, or unverified material | Rights are not cleared; review before redistribution |
| `research-leads/` | Saved transcripts and archived pages mentioning Tesla | Use to find claims, not as verification |
| `personal-notes/` | Personal notes and saved research leads | Public here, but third-party excerpts still require review |

## Evidence tiers

- **A:** primary evidence, such as Tesla's writing, patents, or contemporary records.
- **B:** strong scholarly context or an edited primary source.
- **C:** useful secondary interpretation.
- **D:** leads, personal notes, or unverified material that cannot support a claim alone.

## Known gaps

- `anderson-tesla-work-interview` contains only a small amount of embedded text
  and is marked `needs-ocr`.
- `tesla-complete-us-patents-local-499` is an alternate 499-page patent scan
  with almost no embedded text; the searchable 429-page compilation is separate.
- `personal-notes-nikola-tesla` preserves an empty one-byte source as a cataloged
  placeholder.
- The 52 research leads were selected by Tesla-specific terms and may be only
  tangentially related; they are deliberately isolated from stronger sources.

The exports are generated with `node scripts/export-github-library.mjs`. Local
ingest files under `research/derived/` remain ignored because their manifests
contain machine paths and their page/chunk records duplicate this archive.
