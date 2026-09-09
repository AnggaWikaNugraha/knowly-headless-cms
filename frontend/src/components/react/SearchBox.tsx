import { useEffect, useRef, useState } from 'react';

/**
 * Island pencarian.
 *
 * Tanpa TanStack Query maupun SWR — sesuai keputusan proyek soal minimal
 * dependencies. Yang dibutuhkan hanya debounce, pembatalan request lama, dan
 * tiga keadaan tampilan, dan itu cukup ditangani hook bawaan.
 */

interface Result {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  category: { name: string; slug: string } | null;
  author: { name: string; slug: string } | null;
  cover: string | null;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const DEBOUNCE_MS = 300;

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : '';

export default function SearchBox({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setTotal(0);
      setStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      // Batalkan request sebelumnya: tanpa ini, jawaban lama yang datang
      // terlambat bisa menimpa hasil untuk kata kunci yang lebih baru.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setResults(data.items ?? []);
        setTotal(data.total ?? 0);
        setStatus('done');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setStatus('error');
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Jaga URL tetap mencerminkan pencarian, supaya bisa dibagikan dan di-refresh.
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = query.trim();
    if (q) url.searchParams.set('q', q);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  }, [query]);

  return (
    <div>
      <label htmlFor="q" className="sr-only">Cari artikel</label>
      <input
        id="q"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari artikel…"
        autoComplete="off"
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-gray-500"
      />

      <div className="mt-8" aria-live="polite">
        {status === 'idle' && query.trim().length > 0 && query.trim().length < 2 && (
          <p className="text-sm text-gray-500">Ketik minimal 2 huruf.</p>
        )}

        {status === 'loading' && <p className="text-sm text-gray-500">Mencari…</p>}

        {status === 'error' && (
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 px-6 py-8 text-center">
            <p className="font-medium text-amber-200">Pencarian sedang tidak tersedia</p>
            <p className="mt-2 text-sm text-amber-300/70">Silakan coba lagi beberapa saat lagi.</p>
          </div>
        )}

        {status === 'done' && results.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-700 px-6 py-12 text-center">
            <p className="font-medium text-gray-100">Tidak ada hasil untuk “{query.trim()}”</p>
            <p className="mt-2 text-sm text-gray-400">Coba kata kunci lain, atau lihat semua artikel.</p>
          </div>
        )}

        {status === 'done' && results.length > 0 && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
              {total} hasil
            </p>
            <div className="divide-y divide-gray-800 border-t border-gray-800">
              {results.map((a) => (
                <article key={a.slug} className="flex items-start gap-5 py-7 sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {a.author && <span className="text-gray-300">{a.author.name}</span>}
                      <span aria-hidden="true">·</span>
                      <time dateTime={a.publishedAt ?? undefined}>{formatDate(a.publishedAt)}</time>
                    </div>
                    <h3 className="mt-2 text-lg font-bold leading-snug text-gray-50 sm:text-xl">
                      <a href={`/articles/${a.slug}`} className="line-clamp-2 hover:underline">{a.title}</a>
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-400">{a.excerpt}</p>
                    {a.category && (
                      <p className="mt-4">
                        <a
                          href={`/categories/${a.category.slug}`}
                          className="rounded-full bg-gray-800/70 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-100"
                        >
                          {a.category.name}
                        </a>
                      </p>
                    )}
                  </div>
                  <a href={`/articles/${a.slug}`} className="hidden shrink-0 sm:block">
                    {a.cover
                      ? <img src={a.cover} alt="" width={200} height={134} loading="lazy" className="h-[9rem] w-[13rem] rounded object-cover" />
                      : <div className="h-[9rem] w-[13rem] rounded bg-gradient-to-br from-gray-800 to-gray-900" />}
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
