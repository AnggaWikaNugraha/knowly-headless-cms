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
  /** Jumlah artikel per halaman. Baris daftar jauh lebih ringkas daripada kartu. */
  pageSize: 10,
} as const;

/** URL publik situs. Dipakai untuk canonical URL dan tag Open Graph. */
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

export const nav = [
  { label: 'Artikel', href: '/articles' },
  { label: 'Cari', href: '/search' },
] as const;

/**
 * Base URL portofolio. Kosong saat Knowly disajikan di bawah domain yang sama
 * lewat rewrite `/blogs` (D8) — tautannya jadi relatif dan langsung benar.
 * Diisi hanya saat menjalankan Knowly berdiri sendiri, supaya rail tetap
 * mengarah ke portofolio yang sudah live alih-alih ke 404 lokal.
 */
export const PORTFOLIO_URL = import.meta.env.PUBLIC_PORTFOLIO_URL ?? '';

/**
 * Navigasi tingkat portofolio — isinya menyalin `components/navbar` di sana.
 *
 * Ini BUKAN navigasi Knowly. Rail ini membawa pengunjung keluar ke halaman
 * portofolio; navigasi internal Knowly ada di header dan SideNav.
 */
export const portfolioNav = [
  { label: 'Home', href: '/', icon: 'home', external: true },
  { label: 'Projects', href: '/pages/projects', icon: 'projects', external: true },
  // Selama Knowly berdiri sendiri, Blog menunjuk ke akar Knowly. Setelah
  // rewrite /blogs dipasang di portofolio (D8), ini menjadi '/blogs'.
  { label: 'Blog', href: '/', icon: 'blog', external: false },
  { label: 'About', href: '/pages/about', icon: 'about', external: true },
  { label: 'Language', href: '/pages/language', icon: 'language', external: true },
] as const;
