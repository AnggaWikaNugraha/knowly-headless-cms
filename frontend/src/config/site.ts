/**
 * Konfigurasi situs yang dipakai lintas halaman.
 * Nilai yang berbeda antar environment diambil dari env, bukan ditulis di sini.
 */
export const site = {
  name: 'Knowly',
  tagline: 'Catatan arsitektur web, performa, dan hal-hal yang baru terasa saat deploy',
  description:
    'Knowledge base tentang arsitektur web modern',
  locale: 'id_ID',
  lang: 'id',
  /** Jumlah artikel per halaman pada daftar artikel. */
  pageSize: 6,
} as const;

/** URL publik situs. Dipakai untuk canonical URL dan tag Open Graph. */
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

export const nav = [
  { label: 'Artikel', href: '/articles' },
  { label: 'Cari', href: '/search' },
] as const;
