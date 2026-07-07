/**
 * CSV store importer (spec §12): load the full national store list.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/import-stores.ts stores.csv
 *
 * CSV columns (header required):
 *   retailer_slug,name,address,city,province,postal_code,lat,lng
 * lat/lng may be blank — rows without coordinates are geocoded via Nominatim
 * (1 req/sec, per usage policy). Slug is derived from the name.
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    // simple CSV: handles quoted fields with commas
    const cells: string[] = [];
    let cur = '';
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) {
        cells.push(cur);
        cur = '';
      } else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function geocode(address: string, city: string, province: string): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${address}, ${city}, ${province}, Canada`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
    { headers: { 'User-Agent': 'PennyRadar/1.0 (store-import)' } }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!data[0]) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function main() {
  const file = process.argv[2];
  if (!file || !process.env.DATABASE_URL) {
    console.error('Usage: DATABASE_URL=... npx tsx scripts/import-stores.ts stores.csv');
    process.exit(1);
  }
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  const rows = parseCsv(readFileSync(file, 'utf8'));
  console.log(`Importing ${rows.length} stores…`);

  let imported = 0;
  for (const row of rows) {
    const [retailer] = await db
      .select()
      .from(schema.retailers)
      .where(eq(schema.retailers.slug, row.retailer_slug));
    if (!retailer) {
      console.warn(`  skip: unknown retailer_slug "${row.retailer_slug}"`);
      continue;
    }
    let lat = row.lat ? parseFloat(row.lat) : NaN;
    let lng = row.lng ? parseFloat(row.lng) : NaN;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      const geo = await geocode(row.address, row.city, row.province);
      if (geo) ({ lat, lng } = geo);
      await new Promise((r) => setTimeout(r, 1100)); // Nominatim rate limit
    }
    await db
      .insert(schema.stores)
      .values({
        retailerId: retailer.id,
        name: row.name,
        slug: slugify(row.name.replace(new RegExp(`^${retailer.name}\\s*[—-]?\\s*`, 'i'), '') || row.name),
        address: row.address,
        city: row.city,
        province: row.province.toUpperCase(),
        postalCode: row.postal_code?.toUpperCase().replace(/\s/g, '').replace(/^(.{3})/, '$1 ') || null,
        lat: Number.isNaN(lat) ? null : lat,
        lng: Number.isNaN(lng) ? null : lng,
      })
      .onConflictDoNothing();
    imported++;
  }
  console.log(`✅ Imported ${imported} stores.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
