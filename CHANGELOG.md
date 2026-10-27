# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Dark mode that follows the system setting, with a header toggle that remembers the choice.
- Home page dashboard: intro, featured latest post, project bikes strip, reference links and a recent posts grid.
- Image lightbox for post photos and galleries (previous/next, keyboard, no dependencies).
- Spec plate on vehicle pages and type filters on `/projects/`.
- Posts without a featured image use the thumbnail of their first YouTube video on cards and in social previews.

### Changed

- Visual refresh: theme tokens instead of hard-coded colors, a sticky header, a wider 72rem layout with a narrower reading column, and the linen background removed.
- Post lists, tag and category archives use an image-top card grid, with a placeholder for posts without an image.
- Post pages show the featured image as a hero and related posts as cards.
- Service worker cache bumped to `v2` so returning visitors get the new styles.
- "Marty's Garage" appears less often: the home page heading is now the tagline, and the footer keeps only the copyright line.

### Fixed

- Restored the YouTube video missing from "How to shorten pit bike forks for a moped".
- Restored the YouTube videos missing from "Rally of the Corn Vidya", "Les Brelons Barjots Summer Fun" and "On Any Sunday: The Next Chapter", recovered from the Wayback Machine.

### Removed

- Seven posts whose videos no longer exist anywhere (blip.tv, a news site player, or embeds already gone from the archive). Their URLs, and three tags only they used, redirect to the matching category archive.

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
