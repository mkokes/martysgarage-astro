import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE_TITLE = "Marty's Garage";
export const SITE_DESCRIPTION = 'Half Man, Half Garage, Completely Awesome';
export const POSTS_PER_PAGE = 10;

export type Post = CollectionEntry<'posts'>;

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const postPath = (p: Post) => {
  const [y, m] = p.data.date.split(/[-T]/);
  return `/${y}/${m}/${p.data.slug}/`;
};

const YOUTUBE_ID = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

/** The post's own image, or else the thumbnail of the first YouTube video in its body. */
export const postImage = (p: Post): string | undefined => {
  if (p.data.image) return p.data.image;
  const id = p.body?.match(YOUTUBE_ID)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts.sort((a, b) => b.data.date.localeCompare(a.data.date));
}

export async function getVehicles() {
  const vehicles = await getCollection('vehicles');
  return vehicles.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export const NAV_REFERENCE = [
  ['Moped Manuals', '/reference/moped-manuals/'],
  ['Two Stroke Port Duration', '/reference/two-stroke-port-duration/'],
  ['Moped Stroke Length', '/reference/moped-stroke-length/'],
  ['Fork Tube Sizes', '/reference/fork-tube-sizes/'],
  ['Common Moped Parts', '/reference/common-moped-parts/'],
] as const;
