// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

// https://astro.build/config
export default defineConfig({
  site: 'https://martysgarage.info',
  trailingSlash: 'always',
  redirects: {
    '/manuals/fz600haynesmanual.pdf': '/manuals/yamahafz600.pdf',
    '/newsletter/': '/contact/',
    '/newsletter-signup/': '/contact/',
    '/newsletter-confirmation/': '/contact/',
    '/newsletter-unsubscribe/': '/contact/',
    '/tag/home-improvement-2/': '/tag/home-improvement/',
    '/tag/saab-2/': '/tag/saab/',
    '/tag/dodge-2/': '/tag/dodge/',
    '/tag/test123/': '/',
  },
  integrations: [react(), mdx(), sitemap(), pagefind()]
});