# Marty's Garage

Static site for [martysgarage.info](https://martysgarage.info), a moped and motorcycle hobby blog with project pages and reference material. Built with [Astro](https://astro.build) and hosted on GitHub Pages. It replaces the old WordPress site.

## Requirements

- Node 22.23.4 or newer (`.nvmrc` pins 24)

## Commands

| Command           | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `npm install`     | Install dependencies                           |
| `npm run dev`     | Dev server at `localhost:4321`                 |
| `npm run build`   | Build to `dist/` and generate the search index |
| `npm run preview` | Serve the built site                           |

Search (Pagefind) only works after `npm run build`, not in `npm run dev`.

## Content

Everything lives in `src/content/` as Markdown with frontmatter:

- `posts/` – blog posts. The URL is `/YYYY/MM/slug/`, built from the `date` and `slug` frontmatter.
- `pages/` – standalone pages. The `path` frontmatter is the URL (for example `reference/fork-tube-sizes`).
- `vehicles/` – project pages (`/vehicle/slug/`). These are frontmatter only: specs, parts tables, gallery and linked posts.

To add a post, create `src/content/posts/my-post.md`:

```md
---
title: "My post"
date: "2026-01-31T09:00:00"
slug: "my-post"
categories: ["Mopeds"]
tags: ["Tomos"]
image: "/wp-content/uploads/2026/01/photo.jpg"
excerpt: "Shown on the home page."
wpId: 0
---

Post body in Markdown. YouTube embeds can be pasted as an iframe.
```

`wpId` is a leftover from the migration and is required by the schema; use `0` for new content.

Images are served from `public/wp-content/uploads/YYYY/MM/`. This keeps the original WordPress URLs working. Resize photos to about 1600px wide before adding them. PDF manuals are in `public/manuals/`.

## Contact form

The contact page posts to [Formspree](https://formspree.io/f/xdeekojw). Submissions are emailed by Formspree, and the site has no backend.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. `public/CNAME` sets the custom domain.

## Checks

After a build, two scripts help catch regressions:

- `node scripts/check-links.mjs` – verifies every root-relative `href` and `src` in `dist/` resolves.
- `node scripts/check-parity.mjs` – compares the live site's sitemap URLs with `dist/` (useful before a DNS change).

## Migration scripts

`scripts/extract/` holds the one-off scripts used to convert the WordPress database export into the content above. They are kept for provenance and are not part of the build:

1. `extract.mjs <dump.sql.gz>` writes `src/content/**` and `scrape-cache/manifest.json`.
2. `download-images.mjs` fetches the uploads from the live site, resizes them to 1600px wide, and writes them to `public/wp-content/uploads/`.

The database dump contains private data (form submissions, subscriber emails, password hashes). Never commit it. `*.sql`, `*.sql.gz` and `scrape-cache/` are git-ignored.

## License

Copyright (C) 2026 Marty Kokes

Licensed under the GNU General Public License v3.0 or later. See [LICENSE](LICENSE).
