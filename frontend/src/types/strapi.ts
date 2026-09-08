/**
 * Bentuk respons Strapi 5 REST API.
 *
 * Ditulis dari respons asli, bukan dari dokumentasi: Strapi 5 meratakan
 * nesting `attributes` yang ada di v4, jadi field langsung berada di objeknya.
 * Setiap entri juga punya `documentId` — identitas baru di v5 yang dipakai
 * untuk relasi dan draft/publish, terpisah dari `id` numerik.
 */

/** Field yang dimiliki semua entri Strapi. */
export interface StrapiEntity {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Satu ukuran turunan dari sebuah gambar (thumbnail, small, medium, large). */
export interface StrapiImageFormat {
  url: string;
  width: number;
  height: number;
  mime: string;
}

export interface StrapiMedia extends StrapiEntity {
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: Record<string, StrapiImageFormat> | null;
  url: string;
  mime: string;
}

/** Komponen SEO — tertanam di Article, bukan content type sendiri. */
export interface Seo {
  id: number;
  metaTitle: string;
  metaDescription: string;
  keywords: string | null;
  canonicalURL: string | null;
  socialImage: StrapiMedia | null;
}

export interface Author extends StrapiEntity {
  name: string;
  slug: string;
  bio: string | null;
  avatar: StrapiMedia | null;
}

export interface Category extends StrapiEntity {
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag extends StrapiEntity {
  name: string;
  slug: string;
}

export interface Article extends StrapiEntity {
  title: string;
  slug: string;
  excerpt: string;
  /** Markdown mentah — dirender di server, lihat components/astro/Prose.astro */
  content: string;
  featured: boolean;
  coverImage: StrapiMedia | null;
  author: Author | null;
  category: Category | null;
  tags: Tag[];
  seo: Seo | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/** Respons daftar: `data` array + `meta.pagination`. */
export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: { pagination: Pagination };
}

/** Respons entri tunggal: `data` objek, `meta` kosong. */
export interface StrapiSingleResponse<T> {
  data: T | null;
  meta: Record<string, never>;
}

/** Hasil daftar yang sudah dinormalisasi — komponen tidak perlu tahu soal `data`/`meta`. */
export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}
