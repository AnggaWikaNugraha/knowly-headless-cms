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

/**
 * Backend produksi berjalan di free tier yang tidur saat menganggur. Request
 * pertama setelah jeda harus membangunkannya, dan di CPU yang kecil itu bisa
 * makan puluhan detik.
 *
 * Timeout tunggal 10 detik akan menggagalkan setiap build Vercel dengan
 * "Strapi tidak menjawab". Jadi request bisa diulang dengan jendela yang
 * membesar — percobaan pertama cepat untuk backend yang sudah hidup,
 * percobaan berikutnya cukup sabar untuk yang baru bangun.
 */
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.STRAPI_TIMEOUT_MS ?? 15_000);
const DEFAULT_RETRIES = Number(import.meta.env.STRAPI_RETRIES ?? 2);

export interface RequestOptions {
  /** Batas waktu percobaan pertama. Percobaan berikutnya menggandakannya. */
  timeoutMs?: number;
  /** Jumlah percobaan ulang setelah yang pertama. 0 = gagal cepat. */
  retries?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

async function attempt<T>(url: string, path: string, timeoutMs: number): Promise<T> {
  // Tanpa timeout, Strapi yang menggantung membuat build Astro menggantung juga.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

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
      throw new StrapiError(`Strapi tidak menjawab dalam ${timeoutMs} ms`, 504, path);
    }

    const detail = error instanceof Error ? error.message : String(error);
    throw new StrapiError(`Tidak bisa menghubungi Strapi: ${detail}`, 503, path);
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(
  path: string,
  params: QueryParams = {},
  options: RequestOptions = {},
): Promise<T> {
  const qs = buildQuery(params);
  const url = `${BASE_URL}/api${path}${qs ? `?${qs}` : ''}`;

  const retries = options.retries ?? DEFAULT_RETRIES;
  let timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let last: StrapiError | undefined;

  for (let i = 0; i <= retries; i += 1) {
    try {
      return await attempt<T>(url, path, timeoutMs);
    } catch (error) {
      const err = error as StrapiError;

      // 4xx berarti permintaannya sendiri yang salah — mengulangnya tidak akan
      // mengubah apa pun, dan hanya menahan build lebih lama.
      if (err.status >= 400 && err.status < 500) throw err;

      last = err;
      if (i < retries) {
        await sleep(1_000 * (i + 1));
        timeoutMs *= 2;
      }
    }
  }

  throw last ?? new StrapiError('Permintaan ke Strapi gagal', 503, path);
}

/** Ambil daftar, kembalikan bentuk rata — pemanggil tidak perlu tahu soal `data`/`meta`. */
export async function fetchCollection<T>(
  path: string,
  params: QueryParams = {},
  options: RequestOptions = {},
): Promise<Paginated<T>> {
  const res = await request<StrapiCollectionResponse<T>>(path, params, options);
  return { items: res.data ?? [], pagination: res.meta.pagination };
}

/** Ambil entri pertama yang cocok, atau `null` kalau tidak ada. Untuk pencarian berbasis slug. */
export async function fetchFirst<T>(
  path: string,
  params: QueryParams = {},
  options: RequestOptions = {},
): Promise<T | null> {
  const res = await request<StrapiCollectionResponse<T>>(path, {
    ...params,
    pagination: { limit: 1 },
  }, options);
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
