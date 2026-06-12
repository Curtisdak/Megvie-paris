# Louis Segond 1910 JSON for Supabase — full package

This ZIP contains a Supabase-friendly JSON export of the **French Louis Segond 1910** Bible with headings, cross-references, and footnote-ready tables.

## Included files

- `translation.json` — translation metadata and counts.
- `books.json` — 66 Bible books.
- `chapters.json` — 1,189 chapters with verse counts.
- `verses.json` and `verses.ndjson` — verse rows. Each verse keeps clean `text` plus `section_heading`, `headings`, `cross_references`, `section_cross_references`, and `footnotes` arrays.
- `headings.json` and `headings.ndjson` — standalone heading records.
- `cross_references.json` and `cross_references.ndjson` — standalone inline and section cross-reference records.
- `footnotes.json` and `footnotes.ndjson` — empty for this source, because no `\f ... \f*` markers are present.
- `introductions.json` and `introductions.ndjson` — book introduction paragraph records.
- `supabase_schema.sql` — Supabase/Postgres schema and indexes.
- `import_to_supabase.mjs` — Node importer using `@supabase/supabase-js`.
- `validation.json` — counts and sample objects.

## Counts

```json
{
  "books": 66,
  "chapters": 1189,
  "verses": 31170,
  "headings": 1913,
  "cross_references": 12562,
  "inline_cross_references": 9751,
  "section_cross_references": 2811,
  "footnotes": 0,
  "introduction_paragraphs": 697
}
```

## Example verse object

```json
{
  "translation_id": "lsg1910",
  "book_id": "GEN",
  "book_number": 1,
  "book_name": "Genèse",
  "testament": "OT",
  "id": "LSG1910-GEN-001-001",
  "chapter": 1,
  "verse": 1,
  "reference": "Genèse 1:1",
  "text": "Au commencement, Dieu créa les cieux et la terre.",
  "section_heading": "Création du monde",
  "headings": [
    {
      "id": "LSG1910-GEN-HDG-0003",
      "marker": "ms1",
      "scope": "major_section",
      "level": 1,
      "text": "LES TEMPS ANCIENS"
    },
    {
      "id": "LSG1910-GEN-HDG-0004",
      "marker": "ms2",
      "scope": "major_section",
      "level": 2,
      "text": "DEPUIS LA CRÉATION JUSQU’À ABRAHAM"
    },
    {
      "id": "LSG1910-GEN-HDG-0005",
      "marker": "s",
      "scope": "section",
      "level": 1,
      "text": "Création du monde"
    }
  ],
  "cross_references": [
    {
      "id": "LSG1910-GEN-001-001-XREF-01",
      "kind": "inline",
      "marker": "x",
      "source_reference": "Genèse 1:1",
      "origin_text": "1:1",
      "target_text": "Job 38:4. Ps 33:6; 89:12; 136:5. Ac 14:15; 17:24. Hé 11:3.",
      "caller": "+"
    }
  ],
  "section_cross_references": [
    {
      "id": "LSG1910-GEN-SREF-0001",
      "kind": "major_range",
      "marker": "mr",
      "source_reference": "Genèse ch. 1-11",
      "origin_text": "Ch. 1 à 11",
      "target_text": "9. (Ac 17:24-28.)",
      "caller": ""
    },
    {
      "id": "LSG1910-GEN-SREF-0002",
      "kind": "section",
      "marker": "r",
      "source_reference": "Genèse 1:1",
      "origin_text": "V. 1",
      "target_text": "cf. Né 9:6. (Ps 124:8. Jé 32:17; 10:12.) Ro 1:20. Ap 4:11. Jn 1:1-3.",
      "caller": ""
    }
  ],
  "footnotes": []
}
```

## Supabase import

1. Run `supabase_schema.sql` in the Supabase SQL editor.
2. Install the client:

```bash
npm i @supabase/supabase-js
```

3. Run the importer:

```bash
SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
node import_to_supabase.mjs
```

Use the service-role key only locally or on your server, never in frontend code.

## Query example

```sql
select reference, section_heading, text, headings, cross_references, section_cross_references, footnotes
from public.bible_verses
where book_id = 'JHN' and chapter = 3 and verse = 16;
```

## Source/license note

Louis Segond 1910 is public domain. This package keeps the public-domain verse text and the available source headings/cross-references. The source has no actual USFM footnote markers, so `footnotes.json` is intentionally empty while the data model remains ready for footnotes.
