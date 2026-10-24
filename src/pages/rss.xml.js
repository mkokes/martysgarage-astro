import rss from '@astrojs/rss';
import { getAllPosts, postPath, SITE_TITLE, SITE_DESCRIPTION } from '../lib/site';

export async function GET(context) {
  const posts = (await getAllPosts()).slice(0, 30);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((p) => ({ title: p.data.title, pubDate: new Date(p.data.date), description: p.data.excerpt, link: postPath(p) })),
  });
}
