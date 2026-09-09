import { fetchCollection, fetchFirst } from './client';
import { CARD_POPULATE, DETAIL_POPULATE, SORT_NEWEST } from './query';
import type { Article, Paginated } from '../../types/strapi';
import { site } from '../../config/site';

const PATH = '/articles';

/** Artikel yang ditandai featured — dipakai di hero homepage. */
export function getFeaturedArticles(limit = 2): Promise<Paginated<Article>> {
  return fetchCollection<Article>(PATH, {
    filters: { featured: { $eq: true } },
    populate: CARD_POPULATE,
    sort: SORT_NEWEST,
    pagination: { limit },
  });
}

/**
 * Artikel terbaru.
 *
 * `exclude` dipakai beranda untuk membuang artikel yang sudah tampil sebagai
 * hero — tanpa itu, artikel yang sama muncul dua kali di halaman yang sama.
 */
export function getLatestArticles(limit = 6, exclude: string[] = []): Promise<Paginated<Article>> {
  return fetchCollection<Article>(PATH, {
    ...(exclude.length > 0 ? { filters: { documentId: { $notIn: exclude } } } : {}),
    populate: CARD_POPULATE,
    sort: SORT_NEWEST,
    pagination: { limit },
  });
}

/** Daftar artikel berhalaman untuk /articles. */
export function getArticles(page = 1, pageSize = site.pageSize): Promise<Paginated<Article>> {
  return fetchCollection<Article>(PATH, {
    populate: CARD_POPULATE,
    sort: SORT_NEWEST,
    pagination: { page, pageSize },
  });
}

/** Satu artikel lengkap beserta SEO. `null` kalau slug tidak dikenal. */
export function getArticleBySlug(slug: string): Promise<Article | null> {
  return fetchFirst<Article>(PATH, {
    filters: { slug: { $eq: slug } },
    populate: DETAIL_POPULATE,
  });
}

export function getArticlesByCategory(
  categorySlug: string,
  page = 1,
  pageSize = site.pageSize,
): Promise<Paginated<Article>> {
  return fetchCollection<Article>(PATH, {
    filters: { category: { slug: { $eq: categorySlug } } },
    populate: CARD_POPULATE,
    sort: SORT_NEWEST,
    pagination: { page, pageSize },
  });
}

export function getArticlesByTag(
  tagSlug: string,
  page = 1,
  pageSize = site.pageSize,
): Promise<Paginated<Article>> {
  return fetchCollection<Article>(PATH, {
    filters: { tags: { slug: { $eq: tagSlug } } },
    populate: CARD_POPULATE,
    sort: SORT_NEWEST,
    pagination: { page, pageSize },
  });
}

export function getArticlesByAuthor(
  authorSlug: string,
  page = 1,
  pageSize = site.pageSize,
): Promise<Paginated<Article>> {
  return fetchCollection<Article>(PATH, {
    filters: { author: { slug: { $eq: authorSlug } } },
    populate: CARD_POPULATE,
    sort: SORT_NEWEST,
    pagination: { page, pageSize },
  });
}

/**
 * Artikel lain dalam kategori yang sama, tanpa menyertakan artikel itu sendiri.
 * Kalau kategorinya kosong, kembalikan daftar kosong — bukan error.
 */
export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  if (!article.category) return [];

  const { items } = await fetchCollection<Article>(PATH, {
    filters: {
      category: { slug: { $eq: article.category.slug } },
      documentId: { $ne: article.documentId },
    },
    populate: CARD_POPULATE,
    sort: SORT_NEWEST,
    pagination: { limit },
  });

  return items;
}

/** Pencarian di judul, ringkasan, dan isi. Dipakai lewat /api/search, bukan langsung dari browser. */
export function searchArticles(
  q: string,
  page = 1,
  pageSize = site.pageSize,
): Promise<Paginated<Article>> {
  return fetchCollection<Article>(PATH, {
    filters: {
      $or: [
        { title: { $containsi: q } },
        { excerpt: { $containsi: q } },
        { content: { $containsi: q } },
      ],
    },
    populate: CARD_POPULATE,
    sort: SORT_NEWEST,
    pagination: { page, pageSize },
  });
}

/** Semua slug artikel — dipakai getStaticPaths untuk prerender tiap halaman detail. */
export async function getAllArticleSlugs(): Promise<string[]> {
  const { items } = await fetchCollection<Pick<Article, 'slug'>>(PATH, {
    fields: ['slug'],
    pagination: { limit: 100 },
  });
  return items.map((a) => a.slug);
}
