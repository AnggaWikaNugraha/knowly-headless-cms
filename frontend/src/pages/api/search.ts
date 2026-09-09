import type { APIRoute } from 'astro';
import { searchArticles } from '../../services/strapi/articles';
import { mediaUrl } from '../../services/strapi/client';

/**
 * Proxy pencarian (D4).
 *
 * Island tidak pernah memanggil Strapi langsung. Dengan lewat sini,
 * STRAPI_API_URL tetap di server dan tidak perlu ada entri CORS untuk browser.
 * Hasilnya juga dipangkas ke field yang benar-benar dipakai, bukan meneruskan
 * seluruh respons Strapi.
 */
export const prerender = false;

const MIN_LENGTH = 2;
const MAX_LENGTH = 80;
const PAGE_SIZE = 10;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim();

  if (q.length < MIN_LENGTH) {
    return json({ query: q, items: [], total: 0, tooShort: true });
  }

  // Batas panjang: query raksasa hanya membebani database tanpa hasil berarti.
  if (q.length > MAX_LENGTH) {
    return json({ error: 'Kata kunci terlalu panjang.' }, 400);
  }

  try {
    const { items, pagination } = await searchArticles(q, 1, PAGE_SIZE);

    return json({
      query: q,
      total: pagination.total,
      items: items.map((a) => ({
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        publishedAt: a.publishedAt,
        category: a.category ? { name: a.category.name, slug: a.category.slug } : null,
        author: a.author ? { name: a.author.name, slug: a.author.slug } : null,
        cover: mediaUrl(a.coverImage?.url),
      })),
    });
  } catch {
    // Detail error internal tidak boleh sampai ke browser.
    return json({ error: 'Pencarian sedang tidak tersedia.' }, 503);
  }
};
