# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] - 2026-10-24

### Added

- Astro 7 static site replacing the WordPress installation at martysgarage.info.
- Content collections for posts (286), pages (12) and vehicles (15), converted from the WordPress database export, including captions, galleries and YouTube embeds.
- All 1,173 media uploads, resized to at most 1600px wide, served at their original `/wp-content/uploads/...` URLs. The 25 PDF manuals (one duplicate removed) are served from `/manuals/`.
- Routes that preserve existing URLs: `/YYYY/MM/slug/` posts, `/vehicle/slug/`, `/reference/...`, `/page/N/`, `/tag/...` and `/category/...`.
- Vehicle pages with Specs, Posts and Gallery tabs.
- Pagefind search at `/search/`, RSS at `/rss.xml`, and a sitemap.
- Contact page that posts to Formspree.
- Mobile-friendly navigation with Projects and Reference dropdowns, styled after the old theme.
- `scripts/check-links.mjs` and `scripts/check-parity.mjs` for post-build checks.
- `scripts/extract/` one-off migration scripts.
- `CNAME` for the custom domain.
- Installable PWA: web manifest, icons, and a service worker with an offline fallback page.
- Deploy workflow job that purges the Cloudflare cache after each GitHub Pages deploy; it skips itself until `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are configured.

### Changed

- Old month-less permalinks inside post content (`/2011/slug/`) now point at the full `/YYYY/MM/slug/` URLs.
- Infinite scroll is replaced by `/page/N/` pagination.

### Removed

- WordPress core, theme and plugins, and the unrelated `fow/` project, which are not carried into the new repository.
- Newsletter signup, MailPoet, comments and Gravity Forms. The four newsletter URLs and a few duplicate tag URLs redirect (to `/contact/` or the matching tag page).

[Unreleased]: https://github.com/mkokes/martysgarage-astro/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mkokes/martysgarage-astro/releases/tag/v0.1.0
