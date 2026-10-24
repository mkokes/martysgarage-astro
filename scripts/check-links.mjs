// Verifies every root-relative href/src in dist/ HTML points at a file that exists.
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';

const walk = async (d) => (await Promise.all((await readdir(d, { withFileTypes: true })).map((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))).flat();
const files = (await walk('dist')).filter((f) => f.endsWith('.html'));
const broken = new Map();
const exists = (p) => access(p).then(() => true, () => false);
for (const f of files) {
  const html = await readFile(f, 'utf8');
  for (const m of html.matchAll(/\b(?:href|src)="(\/[^"#?]*)/g)) {
    let u = decodeURIComponent(m[1]);
    if (u.startsWith('//')) continue;
    const target = 'dist' + u;
    if (!(await exists(target)) && !(await exists(path.join(target, 'index.html')))) {
      if (!broken.has(u)) broken.set(u, []);
      broken.get(u).push(f.replace('dist', '').replace('index.html', ''));
    }
  }
}
console.log(`pages: ${files.length}, broken targets: ${broken.size}`);
for (const [u, from] of broken) console.log(`  ${u}  <- ${from.slice(0, 2).join(', ')}${from.length > 2 ? ` (+${from.length - 2})` : ''}`);
