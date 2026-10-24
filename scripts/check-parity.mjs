// Compares the live WordPress sitemap URLs against the built dist/ so no old URL 404s.
// Usage: node scripts/check-parity.mjs [liveOrigin]
import { access } from 'node:fs/promises';

const origin = process.argv[2] ?? 'https://martysgarage.info';
const get = async (u) => (await fetch(u)).text();
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const urls = [];
for (const sm of locs(await get(`${origin}/wp-sitemap.xml`))) {
  if (/taxonomies-(post_format)/.test(sm) || /users/.test(sm)) continue;
  urls.push(...locs(await get(sm)));
}
const missing = [];
for (const u of urls) {
  const p = new URL(u).pathname;
  const file = 'dist' + (p.endsWith('/') ? p + 'index.html' : p);
  try { await access(file); } catch { missing.push(p); }
}
console.log(`live URLs: ${urls.length}, missing in dist: ${missing.length}`);
missing.forEach((m) => console.log('  ' + m));
