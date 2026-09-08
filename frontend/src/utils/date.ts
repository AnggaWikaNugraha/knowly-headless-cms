/** Tanggal panjang berbahasa Indonesia, mis. "8 September 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Perkiraan waktu baca dari jumlah kata. 200 kata/menit adalah angka lazim. */
export function readingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
