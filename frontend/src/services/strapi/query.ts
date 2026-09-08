/**
 * Penyusun query string bergaya Strapi.
 *
 * Strapi memakai sintaks bracket bersarang:
 *   filters[slug][$eq]=foo
 *   populate[author][fields][0]=name
 *   sort[0]=publishedAt:desc
 *
 * Library `qs` biasanya dipakai untuk ini, tapi yang kita butuhkan hanya
 * perataan objek bersarang — sekitar 20 baris. Menambah dependensi untuk itu
 * bertentangan dengan prinsip minimal dependencies di README.
 */
export type QueryParams = Record<string, unknown>;

export function buildQuery(params: QueryParams): string {
  const parts: string[] = [];

  const walk = (prefix: string, value: unknown): void => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(`${prefix}[${i}]`, item));
      return;
    }

    if (typeof value === 'object') {
      for (const [key, nested] of Object.entries(value as QueryParams)) {
        walk(`${prefix}[${key}]`, nested);
      }
      return;
    }

    parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  };

  for (const [key, value] of Object.entries(params)) walk(key, value);
  return parts.join('&');
}

/**
 * Populate untuk kartu artikel di halaman daftar.
 *
 * Sengaja eksplisit, bukan `populate=*`. Wildcard menarik setiap relasi dan
 * setiap ukuran turunan gambar pada tiap request — untuk daftar 6 artikel,
 * itu payload berkali lipat dari yang benar-benar ditampilkan.
 */
export const CARD_POPULATE = {
  coverImage: { fields: ['url', 'alternativeText', 'width', 'height'] },
  author: { fields: ['name', 'slug'] },
  category: { fields: ['name', 'slug'] },
  tags: { fields: ['name', 'slug'] },
} as const;

/** Populate untuk halaman detail — kartu, plus SEO dan avatar penulis. */
export const DETAIL_POPULATE = {
  coverImage: { fields: ['url', 'alternativeText', 'width', 'height'] },
  author: { fields: ['name', 'slug', 'bio'], populate: { avatar: { fields: ['url', 'alternativeText'] } } },
  category: { fields: ['name', 'slug'] },
  tags: { fields: ['name', 'slug'] },
  seo: { populate: { socialImage: { fields: ['url', 'width', 'height'] } } },
} as const;

/** Urut dari yang terbaru. */
export const SORT_NEWEST = ['publishedAt:desc'] as const;
