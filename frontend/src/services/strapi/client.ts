import { buildQuery, type QueryParams } from './query';
import type {
  Paginated,
  StrapiCollectionResponse,
  StrapiSingleResponse,
} from '../../types/strapi';

/**
 * Satu-satunya tempat fetch() dipanggil di seluruh aplikasi.
 *
 * Menyebar fetch() ke komponen terasa lebih cepat sampai bentuk respons
 * berubah dan perubahannya harus dikejar ke belasan tempat. Semua akses
 * Strapi lewat sini.
 */

const BASE_URL = (import.meta.env.STRAPI_API_URL ?? 'http://localhost:1337').replace(/\/+$/, '');
const TIMEOUT_MS = 10_000;

/** Error yang sudah dinormalisasi — halaman tidak pernah melihat error fetch mentah. */
export class StrapiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
  ) {
    super(message);
    this.name = 'StrapiError';
  }
}

async function request<T>(path: string, params: QueryParams = {}): Promise<T> {
  const qs = buildQuery(params);
  const url = `${BASE_URL}/api${path}${qs ? `?${qs}` : ''}`;

  // Tanpa timeout, Strapi yang menggantung membuat build Astro menggantung juga.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new StrapiError(`Strapi menjawab ${res.status} ${res.statusText}`, res.status, path);
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof StrapiError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new StrapiError(`Strapi tidak menjawab dalam ${TIMEOUT_MS} ms`, 504, path);
    }

    const detail = error instanceof Error ? error.message : String(error);
    throw new StrapiError(`Tidak bisa menghubungi Strapi: ${detail}`, 503, path);
  } finally {
    clearTimeout(timer);
  }
}

/** Ambil daftar, kembalikan bentuk rata — pemanggil tidak perlu tahu soal `data`/`meta`. */
export async function fetchCollection<T>(path: string, params: QueryParams = {}): Promise<Paginated<T>> {
  const res = await request<StrapiCollectionResponse<T>>(path, params);
  return { items: res.data ?? [], pagination: res.meta.pagination };
}

/** Ambil entri pertama yang cocok, atau `null` kalau tidak ada. Untuk pencarian berbasis slug. */
export async function fetchFirst<T>(path: string, params: QueryParams = {}): Promise<T | null> {
  const res = await request<StrapiCollectionResponse<T>>(path, {
    ...params,
    pagination: { limit: 1 },
  });
  return res.data?.[0] ?? null;
}

/** Ambil satu entri berdasarkan documentId. */
export async function fetchOne<T>(path: string, params: QueryParams = {}): Promise<T | null> {
  const res = await request<StrapiSingleResponse<T>>(path, params);
  return res.data ?? null;
}

/** URL media Strapi bisa relatif (disk lokal) atau absolut (Cloudinary). Samakan jadi absolut. */
export function mediaUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}
