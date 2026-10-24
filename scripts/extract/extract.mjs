// One-off: convert the WordPress DB dump into Astro content collections.
// Usage: node scripts/extract/extract.mjs <path-to-dump.sql.gz>
// Writes src/content/{posts,pages,vehicles}/ and scrape-cache/{manifest,report}.json
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import TurndownService from 'turndown';
import { loadTables } from './parse-sql.mjs';

const dumpPath = process.argv[2];
if (!dumpPath) throw new Error('usage: extract.mjs <dump.sql.gz>');

const t = await loadTables(dumpPath, [
  'wp_posts', 'wp_postmeta', 'wp_terms', 'wp_term_taxonomy', 'wp_term_relationships', 'wp_p2p',
]);

const report = { unresolvedLinks: [], youtubeConverted: 0, unconvertedEmbeds: [], galleries: 0, notes: [] };

// ---- lookups ----
const posts = t.wp_posts;
const byId = new Map(posts.map((p) => [p.ID, p]));
const meta = new Map();
for (const m of t.wp_postmeta) {
  if (!meta.has(m.post_id)) meta.set(m.post_id, {});
  meta.get(m.post_id)[m.meta_key] = m.meta_value;
}
const getMeta = (id, k) => meta.get(id)?.[k];

const attachments = new Map(); // id -> { file, alt }
const attachmentFiles = new Set();
for (const p of posts.filter((p) => p.post_type === 'attachment')) {
  const file = getMeta(p.ID, '_wp_attached_file');
  if (!file) continue;
  attachments.set(p.ID, { file, alt: getMeta(p.ID, '_wp_attachment_image_alt') ?? '', parent: p.post_parent, order: p.menu_order });
  attachmentFiles.add(file);
}

const terms = new Map(t.wp_terms.map((x) => [x.term_id, x]));
const taxonomy = new Map(t.wp_term_taxonomy.map((x) => [x.term_taxonomy_id, x]));
const termsFor = (postId, tax) =>
  t.wp_term_relationships
    .filter((r) => r.object_id === postId)
    .map((r) => taxonomy.get(r.term_taxonomy_id))
    .filter((x) => x && x.taxonomy === tax)
    .map((x) => terms.get(x.term_id)?.name)
    .filter(Boolean);

// ---- image path handling ----
const usedUploads = new Set();
const UPLOAD_RE = /https?:\/\/(?:www\.)?martysgarage\.info\/wp-content\/uploads\/([^\s"')<>]+)/gi;

function normaliseUpload(rel) {
  rel = decodeURIComponent(rel).replace(/[?#].*$/, '');
  if (!attachmentFiles.has(rel)) {
    const orig = rel.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, '$1');
    if (attachmentFiles.has(orig)) rel = orig;
    else {
      const scaled = rel.replace(/-scaled(\.[a-z0-9]+)$/i, '$1');
      if (attachmentFiles.has(scaled)) rel = scaled;
    }
  }
  usedUploads.add(rel);
  return rel;
}
const uploadUrl = (rel) => '/wp-content/uploads/' + rel.split('/').map(encodeURIComponent).join('/');
const attachmentUrl = (id) => {
  const a = attachments.get(String(id)) ?? attachments.get(Number(id));
  if (!a) return null;
  usedUploads.add(a.file);
  return uploadUrl(a.file);
};

// ---- shortcodes + autop ----
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const BLOCK_START = /^<(h[1-6]|ul|ol|table|blockquote|div|figure|object|iframe|pre|script|p|hr)\b/i;

function youtubeId(s) {
  const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:v\/|embed\/|watch\?(?:[^"'\s]*&)?v=)|youtu\.be\/)([\w-]{11})/i);
  return m?.[1];
}
const ytIframe = (id) =>
  `<iframe class="video" width="560" height="315" src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" allowfullscreen></iframe>`;

function convertShortcodes(html, post) {
  html = html.replace(/\[caption\b[^\]]*\]([\s\S]*?)\[\/caption\]/gi, (_, inner) => {
    const img = inner.match(/<img\b[^>]*>/i)?.[0];
    const cap = inner.replace(/<a\b[^>]*>[\s\S]*?<\/a>/i, '').replace(/<img\b[^>]*>/i, '').trim();
    return `<figure>${img ?? ''}<figcaption>${cap}</figcaption></figure>`;
  });
  html = html.replace(/\[gallery\b([^\]]*)\]/gi, (_, attrs) => {
    report.galleries++;
    const idsAttr = attrs.match(/ids=["']([\d,\s]+)["']/i)?.[1];
    let ids;
    if (idsAttr) ids = idsAttr.split(',').map((s) => s.trim()).filter(Boolean);
    else {
      ids = [...attachments.entries()]
        .filter(([, a]) => String(a.parent) === String(post.ID))
        .sort((a, b) => a[1].order - b[1].order || Number(a[0]) - Number(b[0]))
        .map(([id]) => id);
    }
    const items = ids.map((id) => {
      const u = attachmentUrl(id);
      const alt = attachments.get(String(id))?.alt ?? attachments.get(Number(id))?.alt ?? '';
      return u ? `<a href="${u}"><img src="${u}" alt="${esc(alt)}" loading="lazy"></a>` : '';
    });
    return `<div class="gallery" data-count="${items.length}">${items.join('')}</div>`;
  });
  html = html.replace(/\[\/?bscolumns\b[^\]]*\]/gi, '');
  html = html.replace(/\[(gravityform|wysija_form|wysija_page)\b[^\]]*\]/gi, '');
  return html;
}

function convertEmbeds(html) {
  html = html.replace(/<object\b[\s\S]*?<\/object>/gi, (m) => {
    const id = youtubeId(m);
    if (id) { report.youtubeConverted++; return ytIframe(id); }
    report.unconvertedEmbeds.push(m.slice(0, 160));
    return '';
  });
  html = html.replace(/<embed\b[^>]*>/gi, (m) => {
    const id = youtubeId(m);
    if (id) { report.youtubeConverted++; return ytIframe(id); }
    report.unconvertedEmbeds.push(m.slice(0, 160));
    return '';
  });
  html = html.replace(/<\/?param\b[^>]*>/gi, '');
  html = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  // legacy iframes may be http:// embeds
  html = html.replace(/<iframe\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/iframe>/gi, (m, src) => {
    const id = youtubeId(src);
    return id ? ytIframe(id) : m;
  });
  return html;
}

function autop(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      // bare YouTube URL on its own line (WP oEmbed)
      if (/^https?:\/\/\S+$/.test(b) && youtubeId(b)) { report.youtubeConverted++; return ytIframe(youtubeId(b)); }
      if (BLOCK_START.test(b)) return b;
      return `<p>${b.replace(/\n/g, '<br>\n')}</p>`;
    })
    .join('\n\n');
}

// ---- html -> markdown ----
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*' });
td.keep(['iframe', 'table']);
td.addRule('figure', {
  filter: 'figure',
  replacement(_, node) {
    const img = node.querySelector('img');
    const cap = node.querySelector('figcaption')?.textContent.trim();
    if (!img) return '';
    const md = `![${img.getAttribute('alt') ?? ''}](${img.getAttribute('src')})`;
    return `\n\n${md}${cap ? `\n\n*${cap}*` : ''}\n\n`;
  },
});
td.addRule('gallery', { filter: (n) => n.nodeName === 'DIV' && n.classList?.contains('gallery'), replacement: (_, n) => `\n\n${n.outerHTML}\n\n` });

// Old WordPress permalinks without a month (/2011/slug/) were redirected by WP; resolve them by slug.
const slugToPath = new Map(
  posts.filter((p) => p.post_type === 'post' && p.post_status === 'publish').map((p) => {
    const [y, m] = p.post_date.split(/[- ]/);
    return [p.post_name, `/${y}/${m}/${p.post_name}/`];
  }),
);

function rewriteUrls(md, ctx) {
  md = md.replace(UPLOAD_RE, (_, rel) => uploadUrl(normaliseUpload(rel)));
  md = md.replace(/(https?:\/\/(?:www\.)?martysgarage\.info)?\/(\d{4})\/(?!\d{2}\/)([a-z0-9-]+)\/(?=[\s"')<>])/gi, (m, host, y, slug) => {
    const fixed = slugToPath.get(slug);
    if (fixed && fixed.startsWith(`/${y}/`)) return fixed;
    return m;
  });
  md = md.replace(/https?:\/\/(?:www\.)?martysgarage\.info(\/[^\s"')<>]*)?/gi, (m, p) => {
    if (!p) return '/';
    if (/^\/\?p=\d+/.test(p)) report.unresolvedLinks.push(`${ctx}: ${m}`);
    return p;
  });
  return md;
}

function contentToMarkdown(post) {
  let html = post.post_content;
  html = convertShortcodes(html, post);
  html = convertEmbeds(html);
  html = autop(html);
  let md = td.turndown(html);
  return rewriteUrls(md, post.post_name).replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// ---- output helpers ----
const yamlVal = (v) => JSON.stringify(v); // JSON is valid YAML
const frontmatter = (obj) =>
  '---\n' + Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}: ${yamlVal(v)}`).join('\n') + '\n---\n\n';
const iso = (s) => s.replace(' ', 'T');
const pad = (s) => String(s).padStart(2, '0');
const excerptOf = (p, md) => {
  if (p.post_excerpt?.trim()) return p.post_excerpt.trim();
  const text = md.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<[^>]+>/g, '').replace(/[*_#>`]|\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
  const words = text.split(' ');
  return words.length > 45 ? words.slice(0, 45).join(' ') + '…' : text;
};
const featured = (id) => {
  const tid = getMeta(id, '_thumbnail_id');
  return tid ? attachmentUrl(tid) : null;
};

const OUT = 'src/content';
for (const d of ['posts', 'pages', 'vehicles']) await rm(path.join(OUT, d), { recursive: true, force: true });

// ---- posts ----
const published = (type) => posts.filter((p) => p.post_type === type && p.post_status === 'publish');
const postSlugs = new Set();
const postPathById = new Map();
for (const p of published('post')) {
  const [y, m] = p.post_date.split(/[- ]/);
  const slug = postSlugs.has(p.post_name) ? `${p.post_name}-${p.ID}` : p.post_name;
  postSlugs.add(slug);
  postPathById.set(p.ID, `/${y}/${m}/${p.post_name}/`);
  const md = contentToMarkdown(p);
  const fm = {
    title: p.post_title,
    date: iso(p.post_date),
    slug: p.post_name,
    categories: termsFor(p.ID, 'category'),
    tags: termsFor(p.ID, 'post_tag'),
    image: featured(p.ID),
    excerpt: excerptOf(p, md),
    wpId: Number(p.ID),
  };
  await mkdir(OUT + '/posts', { recursive: true });
  await writeFile(`${OUT}/posts/${slug}.md`, frontmatter(fm) + md);
}

// ---- pages ----
const SKIP_PAGES = new Set(['contact', 'newsletter-signup']);
const pagePath = (p) => {
  const parts = [p.post_name];
  let cur = p;
  while (cur.post_parent && String(cur.post_parent) !== '0') {
    cur = byId.get(cur.post_parent);
    if (!cur) break;
    parts.unshift(cur.post_name);
  }
  return parts.join('/');
};
const pageList = [];
for (const p of published('page')) {
  const pp = pagePath(p);
  pageList.push({ id: p.ID, path: pp, title: p.post_title });
  if (SKIP_PAGES.has(pp)) { report.notes.push(`skipped page ${pp} (handled by hand)`); continue; }
  const md = contentToMarkdown(p);
  await mkdir(path.dirname(`${OUT}/pages/${pp}`), { recursive: true });
  await writeFile(`${OUT}/pages/${pp}.md`, frontmatter({ title: p.post_title, path: pp, template: getMeta(p.ID, '_wp_page_template'), wpId: Number(p.ID) }) + md);
}

// ---- vehicles (ACF) ----
const repeater = (id, name, sub) => {
  const n = Number(getMeta(id, name) ?? 0);
  return Array.from({ length: n }, (_, i) => {
    const row = {};
    for (const [k, suffix] of Object.entries(sub)) row[k] = getMeta(id, `${name}_${i}_${suffix}`) ?? '';
    return row;
  }).filter((r) => Object.values(r).some(Boolean));
};
const partSub = (px) => ({ type: `${px}type`, name: `${px}name`, url: `${px}url`, desc: `${px}desc` });
const phpIds = (s) => [...String(s ?? '').matchAll(/s:\d+:"(\d+)"/g)].map((m) => m[1]);
const p2p = t.wp_p2p;

for (const v of published('vehicle')) {
  const id = v.ID;
  const f = (k) => getMeta(id, k) ?? '';
  const related = p2p
    .filter((r) => String(r.p2p_from) === String(id) && postPathById.has(String(r.p2p_to)) || (String(r.p2p_from) === String(id) && postPathById.has(r.p2p_to)))
    .map((r) => postPathById.get(r.p2p_to) ?? postPathById.get(String(r.p2p_to)));
  const pic = f('picture') ? attachmentUrl(f('picture')) : featured(id);
  const fm = {
    title: v.post_title,
    slug: v.post_name,
    vehicleType: f('vehicle-type'),
    description: f('vehicle_description'),
    year: f('year'),
    make: f('make'),
    model: f('model'),
    engineMaker: f('enman'),
    engineModel: f('enmod'),
    image: pic,
    gallery: phpIds(f('gallery')).map(attachmentUrl).filter(Boolean),
    engine: repeater(id, 'engine_part', partSub('en')),
    fuel: repeater(id, 'fspart', partSub('fs')),
    ignition: repeater(id, 'igpart', partSub('ig')),
    transmission: repeater(id, 'trpart', partSub('tr')),
    exhaust: repeater(id, 'expart', partSub('ex')),
    additional: repeater(id, 'acpart', partSub('ac')),
    customMods: repeater(id, 'cm', { name: 'cmname', desc: 'cmdesc' }),
    relatedPosts: related,
    wpId: Number(id),
  };
  await mkdir(OUT + '/vehicles', { recursive: true });
  await writeFile(`${OUT}/vehicles/${v.post_name}.md`, frontmatter(fm));
}

// ---- manifest ----
// every attachment is downloaded (in case something references it that we missed), plus any used path not in attachments
const all = new Set([...attachmentFiles, ...usedUploads]);
await mkdir('scrape-cache', { recursive: true });
await writeFile('scrape-cache/manifest.json', JSON.stringify({ files: [...all].sort(), used: [...usedUploads].sort(), pages: pageList }, null, 1));
await writeFile('scrape-cache/report.json', JSON.stringify(report, null, 1));
console.log({ posts: postSlugs.size, pages: pageList.length, vehicles: published('vehicle').length, images: all.size, usedImages: usedUploads.size, ...Object.fromEntries(Object.entries(report).map(([k, v]) => [k, Array.isArray(v) ? v.length : v])) });
