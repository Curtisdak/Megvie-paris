# Louis Segond 1910 JSON

This folder contains source data for the French Louis Segond 1910 Bible package.
The app currently uses local Bible data for reading/search and Prisma/Neon for
daily verse storage.

For daily verse notifications, insert approved verses into the
`daily_bible_verses` table created by the Prisma migration:

- `day_of_year`
- `reference`
- `text`
- `translation`
- `theme`
- `source`

Use `npx prisma db seed` for the starter test verses, then replace those rows
with the church-approved 365/366 day list before production.
