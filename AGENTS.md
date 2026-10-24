# AGENTS.md

Static Astro 7 site for martysgarage.info (moped hobby blog), hosted on GitHub Pages. Migrated from WordPress. See README.md for the user-facing overview.

## Commands

- Use Node 22.23.4 or newer (`.nvmrc` pins 24). Older Node fails with "not supported by Astro".
- `npm run dev` starts the dev server. When starting it for an agent session, use `astro dev --background`, and manage it with `astro dev stop|status|logs`.
- `npm run build` builds to `dist/` and runs Pagefind. `npm run preview` serves the build.
- After content or routing changes, run `node scripts/check-links.mjs` (broken internal links and images in `dist/`) and `node scripts/check-parity.mjs` (live WordPress sitemap URLs vs `dist/`).
- Known accepted failures in check-links: two images that already returned 404 on the old site (`2013/12/IMG_20131210_212410.jpg`, `2015/10/20150917_181359.jpg`) and `/manuals/vespaservice.pdf`. Anything else is a regression.

## Layout

- `src/content/{posts,pages,vehicles}/` – content collections (schemas in `src/content.config.ts`). Vehicles have no body, only frontmatter.
- `src/pages/` – routes. `[year]/[month]/[slug].astro` renders posts, `[...slug].astro` renders pages (it skips `projects`), `vehicle/[slug].astro` renders vehicles, and `index.astro` plus `page/[page].astro` handle home pagination. `tag/` and `category/` are archives. `contact.astro`, `search.astro`, `projects.astro`, `404.astro` and `rss.xml.js` are hand-written.
- `src/lib/site.ts` – shared helpers (`postPath`, `slugify`, `getAllPosts`, `getVehicles`, site constants, the Reference menu list).
- `src/layouts/Base.astro` – the only layout; it holds the header nav, footer and meta tags.
- `src/styles/global.css` – all styling (crimson `#ce1446` and lime `#b3d732` on dark `#222`; Raleway body, Lobster headings).
- `public/wp-content/uploads/` – images and PDFs at their original WordPress URL paths. `public/manuals/` – PDF manuals. `public/CNAME` – custom domain.
- `scripts/extract/` – one-off WordPress migration scripts (not part of the build).

## Conventions and gotchas

- URLs must stay stable. `trailingSlash: 'always'`, posts live at `/YYYY/MM/slug/`, and old WordPress URLs must keep resolving (other sites link to them). Add entries to `redirects` in `astro.config.mjs` instead of removing routes.
- Post and page bodies are Markdown (with some raw HTML: iframes, galleries and tables). Internal links are root-relative.
- Images keep their original upload paths. Do not move them into `src/assets` without rewriting the content and keeping redirects.
- Search uses `astro-pagefind` and indexes only elements with `data-pagefind-body`. Keep that attribute on the article wrappers of posts, pages and vehicles.
- The contact form posts to Formspree (`https://formspree.io/f/xdeekojw`). There is no server-side code. Do not add features that need one.
- The newsletter and comments were deliberately dropped. Do not reintroduce them.

## Security

- Never commit a WordPress database dump (`*.sql`, `*.sql.gz`), `scrape-cache/` or `.env`. The dump holds visitor form submissions, subscriber emails and password hashes. These paths are git-ignored. Check `git status` before any commit.
- This is a public repository. Do not add credentials, tokens or personal data.
