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
  const [status, setStatus] = useState<Status>(initialQuery.trim().length >= 2 ? 'loading' : 'idle');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    abortRef.current?.abort();

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

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
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
      <header className="feed-heading">
        <h1>{query.trim() ? <><span className="heading-muted">Hasil untuk </span>{query.trim()}</> : <>Temukan <span className="heading-muted">ide baru.</span></>}</h1>
        {!query.trim() && <p>Cari di judul, ringkasan, dan isi artikel.</p>}
      </header>
      <label htmlFor="q" className="sr-only">Cari artikel</label>
      <div className="search-field">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></svg>
        <input id="q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari artikel…" autoComplete="off" maxLength={80} />
      </div>
      <div className="feed-tabs">
        <span className="feed-tab feed-tab--active">Artikel</span>
        <a href="/articles">Semua artikel</a>
        {status === 'done' && <span className="feed-result-count">{total} hasil</span>}
      </div>
      <div className="search-results" aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'idle' && <p className="feed-state">{query.trim().length > 0 ? 'Ketik minimal 2 huruf.' : 'Tulisan berikutnya yang menginspirasi Anda dimulai dari satu kata.'}</p>}
        {status === 'loading' && <p className="feed-state">Mencari…</p>}
        {status === 'error' && <div className="feed-state"><strong>Pencarian sedang tidak tersedia</strong><p>Silakan coba lagi beberapa saat lagi.</p></div>}
        {status === 'done' && results.length === 0 && (
          <div className="feed-state"><strong>Tidak ada hasil untuk “{query.trim()}”</strong><p>Coba kata kunci lain, atau <a href="/articles">lihat semua artikel</a>.</p></div>
        )}
        {status === 'done' && results.length > 0 && (
          <div className="story-list">
            {results.map((a) => (
              <article key={a.slug} className={`story-row${a.cover ? ' story-row--with-image' : ''}`}>
                <div className="story-byline">
                  {a.author && <a href={`/authors/${a.author.slug}`} className="story-author"><span className="story-avatar">{a.author.name.charAt(0)}</span><span>{a.author.name}</span></a>}
                  {a.author && a.publishedAt && <span aria-hidden="true">·</span>}
                  {a.publishedAt && <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>}
                </div>
                <div className="story-copy">
                  <h2 className="story-title"><a href={`/articles/${a.slug}`}>{a.title}</a></h2>
                  <p className="story-excerpt">{a.excerpt}</p>
                </div>
                {a.cover && <a href={`/articles/${a.slug}`} className="story-thumbnail" tabIndex={-1} aria-hidden="true"><img src={a.cover} alt="" width={240} height={160} loading="lazy" onError={() => setResults((items) => items.map((item) => item.slug === a.slug ? { ...item, cover: null } : item))} /></a>}
                <div className="story-footer">
                  <div className="story-details">{a.category && <a href={`/categories/${a.category.slug}`} className="story-category">{a.category.name}</a>}</div>
                  <a href={`/articles/${a.slug}`} className="story-read" aria-label={`Baca ${a.title}`} title="Baca artikel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
