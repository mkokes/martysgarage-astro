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
    // Posts removed because their videos (blip.tv, news players) no longer exist.
    '/2009/05/mg-13-craiglist-air-cleaners/': '/category/automobiles/',
    '/2009/07/how-to-get-out-of-going-to-church/': '/category/automobiles/',
    '/2009/10/mg46-changing-brake-pads-and-rotors/': '/category/automobiles/',
    '/2010/04/if-i-was-totally-sold-on-the-fiat-500/': '/category/automobiles/',
    '/2011/06/el-mirage/': '/category/motorcycles/',
    '/2011/06/motorcycle-stunts-of-the-1930s/': '/category/motorcycles/',
    '/2011/09/improper-riding-position/': '/category/motorcycles/',
    // Tags and the last home page that only existed because of those posts.
    '/tag/intake/': '/category/automobiles/',
    '/tag/mitsubishi/': '/category/automobiles/',
    '/tag/car-theft/': '/category/automobiles/',
    '/page/29/': '/page/28/',
  },
  integrations: [react(), mdx(), sitemap(), pagefind()]
});