// One-off: download every upload listed in scrape-cache/manifest.json from the live site,
// downsize large photos, and write them to public/wp-content/uploads/ (same URL path as WordPress).
// Raw downloads are cached in scrape-cache/raw (git-ignored) so reruns are cheap.
import { readFile, writeFile, mkdir, stat, copyFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const BASE = 'https://martysgarage.info/wp-content/uploads/';
const MAX_WIDTH = 1600;
const CONCURRENCY = 6;
const { files } = JSON.parse(await readFile('scrape-cache/manifest.json', 'utf8'));
const failures = [];
let done = 0;
let bytesIn = 0;
let bytesOut = 0;

const exists = (p) => stat(p).then(() => true, () => false);

async function fetchRaw(rel, dest) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(BASE + rel.split('/').map(encodeURIComponent).join('/'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function handle(rel) {
  const raw = path.join('scrape-cache/raw', rel);
  const out = path.join('public/wp-content/uploads', rel);
  try {
    if (!(await exists(raw))) await fetchRaw(rel, raw);
    await mkdir(path.dirname(out), { recursive: true });
    const ext = path.extname(rel).toLowerCase();
    bytesIn += (await stat(raw)).size;
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const img = sharp(raw, { failOn: 'none' }).rotate();
      const { width } = await sharp(raw, { failOn: 'none' }).metadata();
      const pipeline = width && width > MAX_WIDTH ? img.resize({ width: MAX_WIDTH }) : img;
      const fmt = ext === '.png' ? pipeline.png({ compressionLevel: 9 }) : ext === '.webp' ? pipeline.webp({ quality: 82 }) : pipeline.jpeg({ quality: 82, mozjpeg: true });
      await fmt.toFile(out);
    } else {
      await copyFile(raw, out);
    }
    bytesOut += (await stat(out)).size;
  } catch (e) {
    failures.push({ rel, error: String(e.message ?? e) });
  } finally {
    if (++done % 100 === 0) console.log(`${done}/${files.length}`);
  }
}

const queue = [...files];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (queue.length) await handle(queue.shift()); }));
await writeFile('scrape-cache/download-failures.json', JSON.stringify(failures, null, 1));
console.log({ total: files.length, failed: failures.length, mbIn: (bytesIn / 1e6).toFixed(0), mbOut: (bytesOut / 1e6).toFixed(0) });
