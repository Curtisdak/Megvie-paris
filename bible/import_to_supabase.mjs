// Import LSG1910 JSON files into Supabase.
// Usage:
//   npm i @supabase/supabase-js
//   SUPABASE_URL='https://YOUR_PROJECT.supabase.co' \
//   SUPABASE_SERVICE_ROLE_KEY='YOUR_SERVICE_ROLE_KEY' \
//   node import_to_supabase.mjs
//
// Run supabase_schema.sql first. Never expose the service-role key in a frontend app.

import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function loadJson(path) { return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8')); }
async function upsertInBatches(table, rows, batchSize = 500) {
  if (!rows.length) { console.log(`${table}: 0 rows`); return; }
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(`${table} batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    console.log(`${table}: ${Math.min(i + batch.length, rows.length)}/${rows.length}`);
  }
}
await upsertInBatches('bible_books', await loadJson('./books.json'));
await upsertInBatches('bible_chapters', await loadJson('./chapters.json'));
await upsertInBatches('bible_verses', await loadJson('./verses.json'), 500);
await upsertInBatches('bible_headings', await loadJson('./headings.json'), 500);
await upsertInBatches('bible_cross_references', await loadJson('./cross_references.json'), 500);
await upsertInBatches('bible_footnotes', await loadJson('./footnotes.json'), 500);
await upsertInBatches('bible_introductions', await loadJson('./introductions.json'), 500);
console.log('Done importing Louis Segond 1910 with headings, cross-references, and footnote support.');
