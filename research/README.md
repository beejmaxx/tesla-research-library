# Tesla research corpus

This directory is the private knowledge layer for the site. The browser should
make the material easier to comprehend: search across books, follow concepts,
compare explanations, and return to the original passage when needed.

## The unit of work

Every source gets:

- a stable `source_id`;
- bibliographic metadata and provenance;
- an evidence tier;
- an explicit rights/publishing decision;
- a checksum of the exact file used;
- page-preserving extracted text;
- small citation chunks that always retain `source_id` and page number;
- later, human notes and claims linked back to those chunks.

The raw file is never silently modified. Local books remain in their original
locations. Derived text is written to `research/derived/`, which is deliberately
git-ignored because this is a personal library and may contain private paths or
copyrighted text. References are quiet infrastructure, not the product's focus.

## Evidence tiers

| Tier | Meaning | Examples |
|---|---|---|
| A | Primary evidence | Patent scan, Tesla lecture/article, letter, lab note, contemporary court record |
| B | Strong scholarly context | Peer-reviewed history, museum catalog, critical edition |
| C | Useful secondary interpretation | Reputable biography, engineering history |
| D | Leads only | Unsourced web article, video transcript, sensational claim |

Tier D material is searchable, but it cannot support a factual statement by
itself. A claim such as “a hidden interview” belongs in a claim-check queue until
its purported original publication can be located.

## Rights states

- `public-domain`: full text and page images may normally be published, subject
  to the source jurisdiction and repository terms.
- `open-license`: publish according to the named license.
- `research-only`: extract and search locally; publish only quotations and notes
  permitted by law.
- `unknown`: do not publish source text or images until reviewed.

Owning a PDF lets us study it, but does not automatically grant republication
rights. The pipeline therefore separates local research access from public-site
visibility.

## Ingest a PDF or text file

```bash
npm run research:ingest -- \
  --file "/path/to/book.pdf" \
  --id tesla-my-inventions-1919 \
  --title "My Inventions" \
  --creator "Nikola Tesla" \
  --tier A \
  --rights public-domain \
  --visibility public
```

The output contains a manifest, page-level text records, and citation chunks.
For scans with no embedded text, the manifest will report `needs_ocr: true`;
OCR is a separate step so machine-generated text is never mistaken for a clean
transcription.

## Comprehension sequence

1. Inventory everything and collapse exact duplicates.
2. Extract text while retaining page numbers when the format has pages.
3. Map passages to concepts such as rotating fields, resonance, wireless
   signaling, magnifying transmitters, telautomatics, and turbines.
4. Build a progressive explanation for each concept: intuition, mechanism,
   Tesla's language, a modern explanation, experiments, and open questions.
5. Compare sources when they disagree or use the same words differently.
6. Keep the whole library local unless its owner later chooses to publish a
   rights-cleared subset.

The seed source map is in `catalog/seed-sources.json`. Machine-local discoveries
are recorded in `private/local-inventory.json` and are never exposed by the site.
The path-safe, page-preserving repository export is under `../library/`; it keeps
research-only material separate from public-domain works and low-confidence
transcript/web leads.
